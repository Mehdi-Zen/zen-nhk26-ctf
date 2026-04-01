const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser());
app.use(express.static('public'));

const FLAG = process.env.CTF_FLAG || 'NHK26{C00k13_M0nst3r_Pl4tf0rm3r}';

// The only way to get the flag - server-side check
app.get('/api/victory', (req, res) => {
  const complete = req.cookies.level_complete;
  const score = parseInt(req.cookies.score || '0');

  if (complete === 'true' && score >= 1000) {
    res.json({
      success: true,
      flag: FLAG,
      message: 'GG ! Tu as hacke le systeme !'
    });
  } else {
    res.json({
      success: false,
      message: 'Nice try... mais il manque quelque chose.'
    });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Mario Hack running on port 3000');
});
