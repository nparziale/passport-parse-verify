var express = require('express')
	, http = require('http')
	, _ = require('underscore')
	, passport = require('passport')
	, LinkedInStrategy = require('passport-linkedin').Strategy
	, GithubStrategy = require('passport-github').Strategy
	, Parse = require('parse').Parse
	, VerifyWithParse = require('../../lib')(Parse);

var app = express();

// configure Express
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'keyboard cat' }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

// Initialize Parse library
Parse.initialize(
	"--key-here--" // Application ID
	, "--key-here--" // REST API Key
	, "--key-here--" // Master Key
);
Parse.Cloud.useMasterKey();

// Passport session setup.
// We'll use VerifyWithParse serialize and deserialize functions
passport.serializeUser(VerifyWithParse.serializeUser);
passport.deserializeUser(VerifyWithParse.deserializeUser);

// Use the LinkedInStrategy within Passport.
// We'll use VerifyWithParse.verify callback function
var LINKEDIN_API_KEY = "--key-here--";
var LINKEDIN_SECRET_KEY = "--key-here--";
passport.use(
	new LinkedInStrategy({
		consumerKey: LINKEDIN_API_KEY
		, consumerSecret: LINKEDIN_SECRET_KEY
		, callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback"
		, profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline', 'picture-url']
		, passReqToCallback: true
		}
	/*
	* VerifyWithParse
	*/
	, VerifyWithParse.verify()
));

// Use the GithubStrategy within Passport.
// We'll use VerifyWithParse.verify callback function
var GITHUB_API_KEY = "--key-here--";
var GITHUB_SECRET_KEY = "--key-here--";
passport.use(
	new GithubStrategy({
		clientID: GITHUB_API_KEY
		, clientSecret: GITHUB_SECRET_KEY
		, callbackURL: "http://127.0.0.1:3000/auth/github/callback"
		, passReqToCallback: true
		}
	/*
	* VerifyWithParse
	*/
	, VerifyWithParse.verify()
));

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated
, function(req, res, next){
	req.user.relation("accounts").query().find()
	.then(function(results){
		req.accounts = results;
		next();
	});
}
, function(req, res){
	var accounts = {};
	_.each(req.accounts, function(account){
		accounts[account.get("provider")] = account.toJSON();
	});
	res.render('account', {
		accounts: accounts
	});
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/linkedin
app.get(
	'/auth/linkedin'
	, passport.authenticate('linkedin', { scope: ['r_basicprofile', 'r_fullprofile', 'r_emailaddress'] })
);

// GET /auth/linkedin/callback
app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
// GET /auth/github
app.get('/auth/github',
  passport.authenticate('github'));
// GET /auth/github/callback
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}
