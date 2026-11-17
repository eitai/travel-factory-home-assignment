import type { RequestHandler } from 'express';

export const allowApiDocsViewer: RequestHandler = (_request, response, next) => {
  response.removeHeader('Content-Security-Policy');
  next();
};
