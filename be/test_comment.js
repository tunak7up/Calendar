const http = require('http');

function post(path, body, contentType) {
    return new Promise((resolve, reject) => {
        const payload = typeof body === 'string' ? body : JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost', port: 3000,
            path, method: 'POST',
            headers: {
                'Content-Type': contentType,
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function runTests() {
    let pass = 0, fail = 0;

    // TEST 1: Raw JSON - cach dung chuan nhat tren Postman
    console.log('=== TEST 1: Raw JSON (Postman: Body > raw > JSON) ===');
    const t1 = await post(
        '/api/comment/task/1',
        { person_id: 1, content: 'Test raw JSON', attachments: ['https://example.com/a.pdf'] },
        'application/json'
    );
    const t1Ok = t1.body.data && t1.body.data.person_id === 1 && t1.body.data.content === 'Test raw JSON';
    console.log('Status:', t1.status);
    console.log('person_id:', t1.body.data?.person_id, '| Mong doi: 1');
    console.log('content:', t1.body.data?.content, '| Mong doi: Test raw JSON');
    console.log('RESULT:', t1Ok ? '[PASS]' : '[FAIL]');
    t1Ok ? pass++ : fail++;

    console.log('');

    // TEST 2: form-urlencoded - Postman chon x-www-form-urlencoded
    console.log('=== TEST 2: form-urlencoded (Postman: Body > x-www-form-urlencoded) ===');
    const t2 = await post(
        '/api/comment/task/1',
        'person_id=1&content=Test+form+urlencoded',
        'application/x-www-form-urlencoded'
    );
    const t2Ok = t2.body.data && t2.body.data.person_id === 1 && t2.body.data.content;
    console.log('Status:', t2.status);
    console.log('person_id:', t2.body.data?.person_id, '| Mong doi: 1');
    console.log('content:', t2.body.data?.content, '| Mong doi: Test form urlencoded');
    console.log('RESULT:', t2Ok ? '[PASS]' : '[FAIL]');
    t2Ok ? pass++ : fail++;

    console.log('');

    // TEST 3: JSON voi attachments array
    console.log('=== TEST 3: JSON voi attachments array ===');
    const t3 = await post(
        '/api/comment/task/1',
        {
            person_id: 1,
            content: 'Test voi attachments',
            attachments: ['https://example.com/file1.pdf', 'https://example.com/file2.png']
        },
        'application/json'
    );
    const t3Ok = t3.body.data && t3.body.data.person_id === 1 && t3.body.data.content;
    console.log('Status:', t3.status);
    console.log('person_id:', t3.body.data?.person_id, '| Mong doi: 1');
    console.log('content:', t3.body.data?.content);
    console.log('Full response:', JSON.stringify(t3.body, null, 2));
    console.log('RESULT:', t3Ok ? '[PASS]' : '[FAIL]');
    t3Ok ? pass++ : fail++;

    console.log('');
    console.log('=====================================');
    console.log(`Ket qua: ${pass} PASS / ${fail} FAIL`);
    console.log('=====================================');
    process.exit(fail > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error('Loi ket noi:', e.message);
    process.exit(1);
});
