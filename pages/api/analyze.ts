import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_POLICY = `
1. プロポーザルの目的が明確で、コミュニティの利益に合致しているか
2. 技術的な実現可能性が十分に検討されているか
3. リスクとその対策が適切に考慮されているか
4. 資金使用の透明性と説明責任が確保されているか
5. コミュニティの長期的な発展に寄与するか
`;

// PDFファイルからテキストを抽出する関数
async function extractTextFromPDF(filePath: string) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return {
    title: 'PDF Proposal', // PDFのファイル名やメタデータから抽出することも可能
    content: data.text,
    organization: 'Unknown Organization',
    platform: 'PDF Document'
  };
}

// プロポーザルの内容を取得する関数
async function fetchProposalContent(url: string) {
  try {
    // Tallyの場合の処理
    if (url.includes('tally.xyz')) {
      const matches = url.match(/proposal\/(.*?)(?:$|\/)/);
      if (!matches) {
        throw new Error('Invalid Tally URL format');
      }

      const [, proposalId] = matches;
      const apiUrl = 'https://api.tally.xyz/query';
      
      const graphqlQuery = {
        query: `
          query GetProposal($proposalId: String!) {
            proposal(
              input: {
                id: $proposalId
              }
            ) {
              id
              title
              description
              body
              proposer {
                address
              }
              governor {
                name
                organization {
                  name
                }
              }
              state
            }
          }
        `,
        variables: {
          proposalId: proposalId
        }
      };

      console.log('Tally API Request:', {
        url: apiUrl,
        query: graphqlQuery,
        proposalId
      });

      const response = await axios.post(apiUrl, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.TALLY_API_KEY || '',
          'Accept': 'application/json'
        }
      });

      console.log('Tally API Response:', response.data);

      const proposalData = response.data?.data?.proposal;
      if (!proposalData) {
        throw new Error('Failed to fetch Tally proposal data: ' + JSON.stringify(response.data));
      }

      // コンテンツの結合（description と body の両方を使用）
      const fullContent = [
        proposalData.description,
        proposalData.body
      ].filter(Boolean).join('\n\n');

      return {
        title: proposalData.title || 'Untitled Proposal',
        content: fullContent || 'No content found',
        organization: proposalData.governor?.organization?.name || 'Unknown Organization',
        platform: 'Tally',
        proposer: proposalData.proposer?.address || 'Unknown Proposer'
      };
    }

    // Uniswap Agoraの場合の処理
    if (url.includes('vote.uniswapfoundation.org')) {
      const response = await axios.get(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // タイトルの取得を改善
      const title = $('h2').first().text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled Proposal';

      // コンテンツの取得を改善
      let content = '';
      
      // 提案の本文を探索
      $('article, .proposal-content, .content').each((_, element) => {
        content += $(element).text().trim() + '\n\n';
      });

      // バックアップとして、主要なセクションのテキストを取得
      if (!content) {
        $('.main-content, .proposal-details, .description').each((_, element) => {
          content += $(element).text().trim() + '\n\n';
        });
      }

      // それでもコンテンツが見つからない場合は、より広い範囲で検索
      if (!content) {
        content = $('body').text().trim();
      }
      
      return {
        title,
        content: content || 'No content found',
        organization: 'Uniswap Foundation',
        platform: 'Uniswap Agora'
      };
    }
    
    // その他のプラットフォームの場合
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    const title = $('h1, h2').first().text().trim() || 'Untitled Proposal';
    let content = '';

    // 主要なコンテンツ領域を探索
    $('article, .content, .proposal-content, .description, .main-content').each((_, element) => {
      content += $(element).text().trim() + '\n\n';
    });

    if (!content) {
      content = $('body').text().trim();
    }
    
    return {
      title: title || 'Untitled Proposal',
      content: content || 'No content found',
      organization: 'Unknown Organization',
      platform: 'Other'
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch proposal content (${statusCode}): ${errorMessage}`);
    }
    throw new Error(`Failed to fetch proposal content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

interface ProposalContent {
  title: string;
  content: string;
  platform: string;
  organization: string;
  proposer?: string;
}

const getPrompt = (content: ProposalContent, policy: string, language: string) => {
  const basePrompt = language === 'ja' ? `
以下のDAOプロポーザルを分析し、指定されたポリシーに基づいて評価してください。

プロポーザル タイトル:
${content.title}

プロポーザル 内容:
${content.content}

プラットフォーム: ${content.platform}
組織: ${content.organization}

ポリシー:
${policy}

以下の形式で回答してください。回答は必ず日本語で行ってください：

{
  "summary": {
    "overview": "プロポーザルの簡潔な概要（200-300文字）",
    "sections": [
      {
        "title": "提案の背景と目的",
        "content": "背景と目的の説明（200-300文字）"
      },
      {
        "title": "技術的実装と実現可能性",
        "content": "技術的な詳細の説明（200-300文字）"
      },
      {
        "title": "期待される効果と影響",
        "content": "効果と影響の分析（200-300文字）"
      }
    ]
  },
  "opinion": {
    "conclusion": {
      "vote": "For または Against",
      "reason": "結論を1文で説明（100文字程度）"
    },
    "reasoning": "ポリシーを踏まえた詳細な理由の説明（400-500文字）"
  }
}` :
  `
Please analyze the following DAO proposal based on the specified policy.

Proposal Title:
${content.title}

Proposal Content:
${content.content}

Platform: ${content.platform}
Organization: ${content.organization}

Policy:
${policy}

Please respond in the following format. Response must be in English:

{
  "summary": {
    "overview": "Brief overview of the proposal (200-300 characters)",
    "sections": [
      {
        "title": "Background and Purpose",
        "content": "Brief explanation of the background and purpose (200-300 characters)"
      },
      {
        "title": "Technical Implementation and Feasibility",
        "content": "Detailed explanation of technical aspects (200-300 characters)"
      },
      {
        "title": "Expected Effects and Impact",
        "content": "Analysis of the expected effects and impact (200-300 characters)"
      }
    ]
  },
  "opinion": {
    "conclusion": {
      "vote": "For or Against",
      "reason": "Explain the conclusion in one sentence (about 100 characters)"
    },
    "reasoning": "Detailed explanation based on the policy (400-500 characters)"
  }
}`;

  return basePrompt;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not set');
      return res.status(500).json({ message: 'OpenAI API key is not configured' });
    }

    let proposalContent;
    if (files.file?.[0]) {
      // PDFファイルが提供された場合
      proposalContent = await extractTextFromPDF(files.file[0].filepath);
    } else if (fields.proposalUrl?.[0]) {
      // URLが提供された場合
      proposalContent = await fetchProposalContent(fields.proposalUrl[0]);
    } else {
      return res.status(400).json({ message: 'No proposal content provided' });
    }

    const policy = fields.policy?.[0] || DEFAULT_POLICY;
    const language = fields.language?.[0] || 'ja';
    const prompt = getPrompt(proposalContent, policy, language);

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are an expert in analyzing DAO proposals. Always respond in valid JSON format as specified in the prompt."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('OpenAI API returned no content');
      }

      const analysis = JSON.parse(completion.choices[0].message.content);

      const result = {
        proposalTitle: proposalContent.title,
        organization: proposalContent.organization,
        platform: proposalContent.platform,
        analysis,
      };

      // PDFファイルが提供された場合、一時ファイルを削除
      if (files.file?.[0]) {
        fs.unlinkSync(files.file[0].filepath);
      }

      return res.status(200).json(result);
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return res.status(500).json({ 
        message: 'Error calling OpenAI API',
        error: openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error'
      });
    }
  } catch (error) {
    console.error('General Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 