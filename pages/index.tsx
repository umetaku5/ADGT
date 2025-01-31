import { useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import Image from 'next/image';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface AnalysisResult {
  proposalTitle: string;
  organization: string;
  platform: string;
  analysis: {
    summary: {
      overview: string;
      sections: {
        title: string;
        content: string;
      }[];
    };
    opinion: {
      conclusion: {
        vote: string;
        reason: string;
      };
      reasoning: string;
    };
  };
}

export default function Home() {
  const [proposalUrl, setProposalUrl] = useState('');
  const [policy, setPolicy] = useState('');
  const [language, setLanguage] = useState<'en' | 'ja'>('ja');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showTallyWarning, setShowTallyWarning] = useState(false);

  const DEFAULT_POLICY = `
    1. プロポーザルの目的が明確で、コミュニティの利益に合致しているか
    2. 技術的な実現可能性が十分に検討されているか
    3. リスクとその対策が適切に考慮されているか
    4. 資金使用の透明性と説明責任が確保されているか
    5. コミュニティの長期的な発展に寄与するか
  `;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setProposalUrl(url);
    setShowTallyWarning(url.includes('tally.xyz'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setProposalUrl('');
      setShowTallyWarning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (pdfFile) {
        formData.append('file', pdfFile);
      } else if (proposalUrl) {
        formData.append('proposalUrl', proposalUrl);
      } else {
        throw new Error('Please provide either a URL or a PDF file');
      }
      
      formData.append('policy', policy || DEFAULT_POLICY);
      formData.append('language', language);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('分析中にエラーが発生しました');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen ${geistSans.variable} ${geistMono.variable} font-sans`}>
      <div className="border-b border-gray-200">
        <div className="p-4">
          <h1 className="text-xl font-semibold">AI DAO Governance Tool</h1>
        </div>
      </div>

      <div className="flex">
        {/* 左サイドバー */}
        <div className="w-1/3 border-r border-gray-200 p-4 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-medium mb-2">Proposal</h2>
              <input
                type="text"
                value={proposalUrl}
                onChange={handleUrlChange}
                placeholder="Proposal URL"
                className="w-full p-2 border rounded-md text-sm"
              />
              <div className="mt-2">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full text-sm"
                />
              </div>
            </section>

            {showTallyWarning && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
                <p className="text-yellow-700">
                  Note: Tally API integration is currently under development. 
                  We recommend uploading a PDF version of the proposal for better analysis.
                </p>
              </div>
            )}

            <section>
              <h2 className="text-sm font-medium mb-2">Policy</h2>
              <textarea
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                placeholder="Enter your policy"
                className="w-full p-2 border rounded-md h-40 text-sm"
              />
              <div className="mt-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'ja')}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>
            </section>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!proposalUrl && !pdfFile)}
              className={`w-full p-2 rounded-md text-white text-sm ${
                loading || (!proposalUrl && !pdfFile)
                  ? 'bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Analyzing...' : 'Execute'}
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{result.proposalTitle}</h2>
                  <div className="flex items-center gap-2">
                    <Image
                      src={`https://cdn.stamp.fyi/avatar/${result.organization.toLowerCase()}`}
                      alt={result.organization}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        // @ts-ignore
                        e.currentTarget.src = 'https://cdn.stamp.fyi/avatar/eth';
                      }}
                    />
                    <span className="text-sm text-gray-600">{result.organization}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Summary Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Summary</h3>
                  <div className="space-y-6">
                    <section className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Overview</h4>
                      <p className="text-sm text-gray-600">
                        {result.analysis.summary.overview}
                      </p>
                    </section>
                    {result.analysis.summary.sections.map((section, index) => (
                      <section key={index} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">{section.title}</h4>
                        <p className="text-sm text-gray-600">{section.content}</p>
                      </section>
                    ))}
                  </div>
                </div>

                {/* Opinion Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Opinion</h3>
                  <div className="space-y-6">
                    <section className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Conclusion</h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          I think we should vote{' '}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                            result.analysis.opinion.conclusion.vote === 'For'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.analysis.opinion.conclusion.vote}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {result.analysis.opinion.conclusion.reason}
                        </p>
                      </div>
                    </section>

                    <section className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Reasoning</h4>
                      <p className="text-sm text-gray-600">
                        {result.analysis.opinion.reasoning}
                      </p>
                    </section>

                    <div className="pt-4">
                      <h4 className="font-medium mb-2">Action</h4>
                      <p className="text-sm mb-2">
                        I suggest you vote{' '}
                        <span className={`font-medium ${
                          result.analysis.opinion.conclusion.vote === 'For'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {result.analysis.opinion.conclusion.vote}
                        </span>
                        {' '}this proposal
                      </p>
                      <button
                        className={`w-full p-2 rounded-md text-white text-sm ${
                          result.analysis.opinion.conclusion.vote === 'For'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        Vote {result.analysis.opinion.conclusion.vote}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="flex items-center justify-center h-full text-gray-500">
              結果がここに表示されます
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
