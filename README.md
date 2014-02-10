passport-parse-verify
=====================
Just generate a callback for Passport Strategies using VerifyWithParse:
```javascript
passport.use(
	new LinkedInStrategy({
		consumerKey: LINKEDIN_API_KEY
		, consumerSecret: LINKEDIN_SECRET_KEY
		, callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback"
		, passReqToCallback: true
		}
	, VerifyWithParse.verify()
));
```
Note: setting passReqToCallback is required to have multiple linked accounts