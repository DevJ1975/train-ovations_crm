import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://oauth2.googleapis.com/token', async () =>
    HttpResponse.json({
      access_token: 'msw-google-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
    }),
  ),
  http.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', async () =>
    HttpResponse.json({
      items: [{ id: 'primary', summary: 'Primary Calendar' }],
    }),
  ),
  http.get('https://api.notion.com/v1/users/me', async () =>
    HttpResponse.json({
      object: 'user',
      id: 'notion-user-1',
      name: 'Trainovations Bot',
    }),
  ),
  http.post('https://api.resend.com/emails', async () =>
    HttpResponse.json({
      id: 're_test_email_1',
    }),
  ),
];
