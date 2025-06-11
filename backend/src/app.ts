import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 8088;

app.get('/', (req: Request, res: Response) => {
  res.send('Appointment backend root endpoint');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});