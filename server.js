// server.js
require('dotenv').config();
const express = require('express');
// const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

const jsonAuth = process.env.JSON_AUTH;
const xmlAuth = process.env.XML_AUTH;

// console.log(`xml: ${xmlAuth}`);

app.use(express.static('.')); // serve index.html

app.get('/proxy/json/:id', async (req, res) => {
    const id = req.params.id;
    if (id) {
        // console.log(`fetching json: ${id}`)
        const response = await fetch(`https://rdo.renomia.cz/api/2.0/sml_nacist_smlouvy_5289/${id}`, {
            headers: { Authorization: jsonAuth }
        });
        const data = await response.json();
        res.json(data);
    }
});

app.get('/proxy/xml1/:id', async (req, res) => {
    const id = req.params.id;
    const xmlBody = `
<request>
  <sql-query>
    <select type="doklad_ke_smlouve" user="4" setting="6062">
SELECT  TOP 1000 T101382.pdk                      AS 'pdk'
      ,T101382_100069.zkludj_lgn                 AS 'loginAutora'
      ,(T101382.xc_crdt + T101382.xc_crtm)       AS 'datumVytvoreni'
      ,(T101382.xc_chdt + T101382.xc_chtm)       AS 'datumPosledniUpravy'
      ,T101382.smlv_vrzsml                       AS 'verzeSmlouvy'
      ,T101382.smlv_klnt                         AS 'klient'
      ,T101382.smlv_rcic                         AS 'rc_ic'
      ,T101382.smlv_smhsid                       AS 'histId'
      ,T101382.dtldkl_blspzm                     AS 'speicifikaceZmeny'
      ,T101382_101384.dtlsml_cslsml_dlscsl_idsml AS 'idSmlouvy'
FROM dbo.dkksm-!- AS T101382
LEFT JOIN dbo.smlv-!- AS P101133
ON P101133.pdk = ${id}
LEFT JOIN dbo.uzvt-!- AS T101382_100069
ON T101382_100069.pdk = T101382.xc_auth
LEFT JOIN dbo.smlv-!- AS T101382_101384
ON T101382_101384.pdk = T101382.fdk1
WHERE (T101382.xc_del = 0)
AND (T101382.fdk1 = P101133.pdk)
    </select>
  </sql-query>
</request>
    `;
const response = await fetch('https://rdo.renomia.cz/solve', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/xml',
        Authorization: xmlAuth
    },
    body: xmlBody
});
const text = await response.text();
res.send(text);
});

app.get('/proxy/xml2/:id', async (req, res) => {
    const id = req.params.id;
    const xmlBody = `<request session="csession">
  <get-history>
    <list type="smlouva" dkey="${id}"/>
  </get-history>
</request>`;
    const response = await fetch('https://rdo.renomia.cz/solve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/xml',
            Authorization: xmlAuth,
            Cookie: 'cauth=BASIC; csession=6095'
        },
        body: xmlBody
    });
    const text = await response.text();
    res.send(text);
});

app.get('/test/env', async (req, res) => {
        res.send(process.env.TEST_VARIABLE);
});

app.listen(PORT, () => console.log(`Server běží na http://localhost:${PORT}`)); 
