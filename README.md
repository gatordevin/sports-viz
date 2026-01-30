# StatFlow - Professional Sports Analytics

Real-time sports data, analytics, and visualizations for fantasy leagues and sports betting.

## Features

### Free Tier
- Live NBA & NFL scores
- Team information and logos
- Game schedules
- Basic statistics
- Historical data

### Premium (Coming Soon)
- Live betting odds and line movements
- AI-powered projections
- Custom alerts and notifications
- API access
- Advanced analytics and visualizations

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Data Source:** ESPN API (free, no key required)
- **Deployment:** Vercel

## API Usage

This app uses the ESPN public API which provides:
- Live game scores and status
- Team information
- Player rosters
- Schedule data

No API key is required. Data updates every 60 seconds.

### ESPN API Endpoints Used:
```
GET https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
GET https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams
GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This app is configured for Vercel deployment. Simply connect your GitHub repository to Vercel and it will auto-deploy.

## License

MIT
