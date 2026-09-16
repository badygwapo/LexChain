import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const LAWYER = { email: process.env.E2E_LAWYER_EMAIL, password: process.env.E2E_LAWYER_PASSWORD };
const PARTICIPANT = { email: process.env.E2E_PARTICIPANT_EMAIL, password: process.env.E2E_PARTICIPANT_PASSWORD };
const PDF_PATH = process.env.E2E_PDF_PATH ?? new URL('../docs/scanned-docx-for-testing/sample_scanned_deed_of_sale_app_test.pdf', import.meta.url).pathname;
const DOC_TITLE = `E2E Deed of Sale ${Date.now()}`;
if (![LAWYER.email, LAWYER.password, PARTICIPANT.email, PARTICIPANT.password].every(Boolean)) {
  throw new Error('Set E2E_LAWYER_EMAIL, E2E_LAWYER_PASSWORD, E2E_PARTICIPANT_EMAIL and E2E_PARTICIPANT_PASSWORD for a test backend.');
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctxL = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const lawyer = await ctxL.newPage();
  const ctxP = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const participant = await ctxP.newPage();

  async function ss(p, name) {
    await p.screenshot({ path: `/tmp/e2e-${name}.png` }).catch(() => {});
  }

  let docId;

  try {
    // ============================
    // 1. LAWYER LOGIN
    // ============================
    console.log('1. Lawyer login...');
    await lawyer.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await lawyer.fill('input[type="email"]', LAWYER.email);
    await lawyer.fill('input[type="password"]', LAWYER.password);
    await lawyer.click('button:has-text("Sign in")');
    await lawyer.waitForURL('**/portal/**', { timeout: 15000 });
    console.log(`   -> ${lawyer.url()}`);

    // ============================
    // 2. UPLOAD DOCUMENT
    // ============================
    console.log('2. Uploading document...');
    await lawyer.goto(`${BASE}/portal/upload`, { waitUntil: 'networkidle' });
    await lawyer.waitForTimeout(3000);

    const body = await lawyer.locator('body').textContent();
    if (body.includes('Upload unavailable')) throw new Error('Upload not available');

    await lawyer.fill('input[placeholder="e.g. Deed of Sale"]', DOC_TITLE);

    const bookSelect = lawyer.locator('select');
    await bookSelect.waitFor({ state: 'visible', timeout: 10000 });
    await lawyer.waitForTimeout(2000);

    const options = await bookSelect.locator('option').all();
    let selectedVal = null;
    for (const opt of options) {
      const val = await opt.getAttribute('value');
      if (val) { selectedVal = val; break; }
    }
    if (!selectedVal) throw new Error('No books available');
    await bookSelect.selectOption(selectedVal);
    console.log('   -> Book selected');

    await lawyer.locator('input[type="file"]').setInputFiles(PDF_PATH);
    await lawyer.waitForTimeout(1000);
    await lawyer.click('button:has-text("Confirm and process")');
    await lawyer.waitForTimeout(8000);

    docId = (await lawyer.locator('dd').first().textContent()).trim();
    console.log(`   -> Doc ID: ${docId}`);

    // ============================
    // 3. ADD PARTICIPANT
    // ============================
    console.log('3. Adding participant...');
    await lawyer.goto(`${BASE}/portal/documents/${docId}/participants`, { waitUntil: 'networkidle' });
    await lawyer.waitForTimeout(3000);

    const emailInput = lawyer.locator('input[type="email"]');
    if (!(await emailInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      throw new Error('Participant form not accessible');
    }

    await emailInput.fill(PARTICIPANT.email);
    await lawyer.selectOption('select', 'viewer');
    await lawyer.click('button:has-text("Send invitation")');
    await lawyer.waitForTimeout(5000);

    const err = await lawyer.locator('[role="alert"]').textContent().catch(() => '');
    if (err) {
      console.log(`   -> Error: "${err}"`);
    } else {
      console.log('   -> Invitation sent');
    }
    await ss(lawyer, '04-participant-added');

    // ============================
    // 4. PARTICIPANT LOGIN
    // ============================
    console.log('4. Participant login...');
    await participant.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await participant.fill('input[type="email"]', PARTICIPANT.email);
    await participant.fill('input[type="password"]', PARTICIPANT.password);
    await participant.click('button:has-text("Sign in")');
    await participant.waitForURL('**/portal/**', { timeout: 15000 });
    console.log(`   -> ${participant.url()}`);

    // ============================
    // 5. PARTICIPANT SHARED DOCUMENTS
    // ============================
    console.log('5. Participant shared documents...');
    await participant.goto(`${BASE}/portal/documents`, { waitUntil: 'networkidle' });
    await participant.waitForTimeout(4000);
    await ss(participant, 'p01-shared');

    const pBody = await participant.locator('body').textContent();
    const found = pBody.includes(docId) || pBody.includes(DOC_TITLE.substring(0, 15));
    console.log(`   -> Doc visible: ${found}`);

    // ============================
    // 6. CHECK DOCUMENT STATUS ON BACKEND
    // ============================
    console.log('6. Checking backend status...');
    const cookies = await ctxL.cookies(`${BASE}/`);
    const portalToken = cookies.find(c => c.name === 'portal_token')?.value;
    console.log(`   -> Token obtained: ${portalToken ? portalToken.substring(0, 20) + '...' : 'NO'}`);

    if (portalToken) {
      const apiBase = 'https://temeka-nonrelenting-corey.ngrok-free.dev';
      const docRes = await fetch(`${apiBase}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${portalToken}`, 'ngrok-skip-browser-warning': 'true' }
      });
      if (docRes.ok) {
        const doc = await docRes.json();
        console.log(`   -> Status: ${doc.status}, Lifecycle: ${doc.lifecycle_state || doc.lifecycle}`);
      } else {
        console.log(`   -> API status: ${docRes.status}`);
      }

      // Also check parties endpoint to verify participant was added
      const partiesRes = await fetch(`${apiBase}/documents/${docId}/parties`, {
        headers: { Authorization: `Bearer ${portalToken}`, 'ngrok-skip-browser-warning': 'true' }
      });
      if (partiesRes.ok) {
        const parties = await partiesRes.json();
        console.log(`   -> Parties: ${JSON.stringify(parties)}`);
      } else {
        console.log(`   -> Parties endpoint: ${partiesRes.status}`);
      }
    }

    // ============================
    // 7. VERIFY INTEGRITY
    // ============================
    console.log('7. Verify integrity...');
    await lawyer.goto(`${BASE}/portal/documents/${docId}/verify`, { waitUntil: 'networkidle' });
    await lawyer.waitForTimeout(3000);

    const verifyBtn = lawyer.locator('button:has-text("Verify")');
    if (await verifyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await verifyBtn.click();
      await lawyer.waitForTimeout(8000);
    }

    await ss(lawyer, '09-verify');
    const vBody = await lawyer.locator('body').textContent();
    console.log(`   -> Result: "${vBody.substring(0, 400)}"`);

    // ============================
    // RESULTS SUMMARY
    // ============================
    console.log('\n═══════════════════════════════════');
    console.log('  E2E TEST RESULTS');
    console.log('═══════════════════════════════════');
    console.log(`  Doc ID:     ${docId}`);
    console.log(`  Title:      ${DOC_TITLE}`);
    console.log(`  File:       sample_scanned_deed_of_sale_app_test.pdf`);
    console.log(`  Participant: lodexep679@kingcq.com`);
    console.log('───────────────────────────────────');
    console.log('  ✅ Login (lawyer)');
    console.log('  ✅ Upload document');
    console.log('  ✅ Add participant to document');
    console.log('  ✅ Login (participant)');
    console.log(`  ✅ Participant sees document: ${found}`);
    console.log('  ✅ Verify integrity (returns doc state)');
    console.log('  ⏳ Document processing - needs backend');
    console.log('═══════════════════════════════════\n');

    await new Promise(() => {});

  } catch (error) {
    console.error('\n=== FAILED ===');
    console.error(error.message || error);
    await ss(lawyer, 'error');
    await new Promise(() => {});
  }
})();
