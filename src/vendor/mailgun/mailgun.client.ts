export class MailgunClient {
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly baseUrl: string;

  constructor(input: { apiKey: string; domain: string; baseUrl?: string }) {
    this.apiKey = input.apiKey;
    this.domain = input.domain;
    this.baseUrl = input.baseUrl ?? 'https://api.mailgun.net';
  }

  async sendMessage(input: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    const url = new URL(`/v3/${this.domain}/messages`, this.baseUrl);
    const form = new FormData();
    form.set('from', input.from);
    form.set('to', input.to);
    form.set('subject', input.subject);
    form.set('text', input.text);
    if (input.html) {
      form.set('html', input.html);
    }

    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`
      },
      body: form
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Mailgun request failed: ${response.status} ${body}`);
    }
  }
}
