import express from 'express';
const app = express();
app.get('/health', (_req, res) => res.json({
  status: 'ok'
}));
const port = process.env.PORT || 3007;
app.listen(port, () => console.log(`admin-service listening on ${port}`));