import express from 'express';

const app = express();
const port = process.env.PORT || 3002;

app.get('/', (req, res) => {
  res.send('Administration Service is running');
});

app.listen(port, () => {
  console.log(`Administration Service listening on port ${port}`);
});
