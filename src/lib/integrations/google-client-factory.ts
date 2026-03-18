import { google } from 'googleapis';

type GoogleClientOptions = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

function getGoogleOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_OAUTH_REDIRECT_URI ??
      'http://localhost:3000/api/integrations/google/callback',
  };
}

export class GoogleClientFactory {
  static createOAuthClient(tokens: GoogleClientOptions = {}) {
    const config = getGoogleOAuthConfig();

    const client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );

    if (tokens.accessToken || tokens.refreshToken) {
      client.setCredentials({
        access_token: tokens.accessToken ?? undefined,
        refresh_token: tokens.refreshToken ?? undefined,
      });
    }

    return client;
  }

  static createCalendarClient(tokens: GoogleClientOptions = {}) {
    return google.calendar({
      version: 'v3',
      auth: this.createOAuthClient(tokens),
    });
  }

  static createDriveClient(tokens: GoogleClientOptions = {}) {
    return google.drive({
      version: 'v3',
      auth: this.createOAuthClient(tokens),
    });
  }

  static createGmailClient(tokens: GoogleClientOptions = {}) {
    return google.gmail({
      version: 'v1',
      auth: this.createOAuthClient(tokens),
    });
  }
}
