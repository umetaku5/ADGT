# API References

## Tally API

### Base URL
```
https://api.tally.xyz/query
```

### Required Headers
```
'Content-Type': 'application/json'
'Api-Key': 'YOUR_API_KEY'
'Accept': 'application/json'
```

### Example Queries

#### Get Proposal
```graphql
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
```

### Important Notes
- Tally APIはGraphQLベース
- APIキーは必須
- レスポンスは必ずJSON形式
- エラーコード422は通常、クエリの構文やパラメータの問題を示す

## GraphQL Tips

### Basic Query Structure
```graphql
query QueryName($variable: Type!) {
  field(input: { id: $variable }) {
    subfield1
    subfield2
    nested {
      field
    }
  }
}
```

### Best Practices
1. クエリには適切な名前をつける
2. 必要なフィールドのみを要求する
3. 変数は型を明示的に指定する
4. ネストされたフィールドは適切に構造化する

### References
- [Tally API Documentation](https://apidocs.tally.xyz/#introduction)
- [GraphQL Learn](https://graphql.org/learn/queries/)
- [Tally API Quickstart](https://github.com/withtally/tally-api-quickstart) 