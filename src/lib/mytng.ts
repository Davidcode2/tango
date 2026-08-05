import * as cheerio from 'cheerio';

const MYTNG_BASE = 'https://www.mytng.de';

export interface MyTNGSession {
  cookies: string;
}

export interface Invoice {
  number: string;
  date: string;
  pdfUrl?: string;
  csvUrl?: string;
}

export interface SIMCard {
  number: string;
  status: string;
}

export interface ServiceInfo {
  title: string;
  description: string;
  links: { text: string; url: string }[];
}

export interface AccountInfo {
  title: string;
  description: string;
  links: { text: string; url: string }[];
}

export interface DashboardInfo {
  userName: string;
  lastLogin: string;
  services: { text: string; url: string }[];
}

async function fetchPage(
  path: string,
  session: MyTNGSession
): Promise<string> {
  const res = await fetch(`${MYTNG_BASE}${path}`, {
    headers: {
      Cookie: session.cookies,
      'User-Agent': 'Mozilla/5.0 (compatible; Tango/0.1)',
    },
  });
  if (!res.ok) {
    throw new Error(`myTNG returned ${res.status} for ${path}`);
  }
  return res.text();
}

export async function login(
  username: string,
  password: string
): Promise<MyTNGSession | null> {
  const loginUrl =
    '/web/guest/home?p_p_id=TNG_MYTNG_LOGIN&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-2&p_p_col_count=1&saveLastPath=0&_TNG_MYTNG_LOGIN_struts_action=%2Fmytng_login%2Fview&_TNG_MYTNG_LOGIN_cmd=update';

  const body = new URLSearchParams({
    _TNG_MYTNG_LOGIN_redirect: '/group/mytng/start',
    _TNG_MYTNG_LOGIN_rememberMe: 'false',
    _TNG_MYTNG_LOGIN_login: username,
    _TNG_MYTNG_LOGIN_password: password,
  });

  const res = await fetch(`${MYTNG_BASE}${loginUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (compatible; Tango/0.1)',
    },
    body: body.toString(),
    redirect: 'manual',
  });

  // Liferay redirects on successful login
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length === 0) return null;

  const cookies = setCookies
    .map((c: string) => c.split(';')[0])
    .join('; ');

  // Follow redirect to get full session
  const homeRes = await fetch(`${MYTNG_BASE}/group/mytng/start`, {
    headers: {
      Cookie: cookies,
      'User-Agent': 'Mozilla/5.0 (compatible; Tango/0.1)',
    },
    redirect: 'follow',
  });

  const homeSetCookies = homeRes.headers.getSetCookie?.() ?? [];
  const allCookies = [
    ...cookies.split('; '),
    ...homeSetCookies.map((c: string) => c.split(';')[0]),
  ];

  return { cookies: [...new Set(allCookies)].join('; ') };
}

export async function getDashboard(
  session: MyTNGSession
): Promise<DashboardInfo> {
  const html = await fetchPage('/group/mytng/start', session);
  const $ = cheerio.load(html);

  const userName = $('.welcome-text, .user-name').first().text().trim()
    || $('body').text().match(/Hallo\s+([^\s]+)/)?.[1] || '';

  const lastLoginMatch = $('body')
    .text()
    .match(/Letzter Login.*?(\d{2}\.\d{2}\.\d{4}.*?\d{2}:\d{2}:\d{2})/s);

  const services: { text: string; url: string }[] = [];
  $('.nav-item a, .portlet-menu a').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (href && text && href.startsWith('/group/mytng/')) {
      services.push({ text, url: href });
    }
  });

  return {
    userName,
    lastLogin: lastLoginMatch?.[1] || '',
    services,
  };
}

export async function getInvoices(
  session: MyTNGSession
): Promise<Invoice[]> {
  const html = await fetchPage(
    '/group/mytng/mein-vertrag/rechnungsarchiv',
    session
  );
  const $ = cheerio.load(html);

  const invoices: Invoice[] = [];
  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 4) {
      const number = $(cells[0]).text().trim();
      const date = $(cells[1]).text().trim();
      if (number && date && number !== 'Rechnungsnr.') {
        const pdfLink = $(cells[2]).find('a').attr('href');
        const csvLink = $(cells[3]).find('a').attr('href');
        invoices.push({
          number,
          date,
          pdfUrl: pdfLink ? `${MYTNG_BASE}${pdfLink}` : undefined,
          csvUrl: csvLink ? `${MYTNG_BASE}${csvLink}` : undefined,
        });
      }
    }
  });

  return invoices;
}

export async function getSIMCards(
  session: MyTNGSession
): Promise<SIMCard[]> {
  const html = await fetchPage(
    '/group/mytng/mein-vertrag/meine-simkarten',
    session
  );
  const $ = cheerio.load(html);

  const cards: SIMCard[] = [];
  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 2) {
      const number = $(cells[0]).text().trim();
      const status = $(cells[1]).text().trim();
      if (number && status) {
        cards.push({ number, status });
      }
    }
  });

  return cards;
}

export async function getServices(
  session: MyTNGSession
): Promise<ServiceInfo> {
  const html = await fetchPage('/group/mytng/dienste', session);
  const $ = cheerio.load(html);

  const title = $('h1').first().text().trim();
  const description = $('h2').first().text().trim();

  const links: { text: string; url: string }[] = [];
  $('.portlet-content a, .content a').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (href && text) {
      links.push({
        text,
        url: href.startsWith('http') ? href : `${MYTNG_BASE}${href}`,
      });
    }
  });

  return { title, description, links };
}

export async function getAccounts(
  session: MyTNGSession
): Promise<AccountInfo> {
  const html = await fetchPage('/group/mytng/zugaenge', session);
  const $ = cheerio.load(html);

  const title = $('h1').first().text().trim();
  const description = $('h2').first().text().trim();

  const links: { text: string; url: string }[] = [];
  $('.portlet-content a, .content a').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (href && text) {
      links.push({
        text,
        url: href.startsWith('http') ? href : `${MYTNG_BASE}${href}`,
      });
    }
  });

  return { title, description, links };
}
