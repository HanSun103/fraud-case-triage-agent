# Processed Knowledge Store

This folder holds generated chunk metadata for the local RAG pipeline.

When `retrieveGuidanceForAlert()` or `loadKnowledgeStore()` runs on the server, the app builds `guidance-store.json` here if it does not exist yet or if the raw knowledge files are newer.

The processed store is file-based on purpose:

- no database is required
- retrieval stays easy to inspect
- generated chunks can be reviewed for demo explainability
