const WEBSITE_URL = 'https://appointment-ui.lutfifadlan.com';
const LOGO_PNG = '/logo.png';

const Common = {
  title: "SyncPoint",
  description: "Intelligent and reliable appointment management platform that ease collaboration and prevents schedule conflicts",
  tagline: "Where schedules sync, conflicts don't.",
  image: LOGO_PNG,
  logo: LOGO_PNG,
  liveLogo: `${WEBSITE_URL}/logo.png`,
  websiteUrl: WEBSITE_URL,
}

const Document = {
  title: Common.title,
  description: Common.description,
  fontUrl: 'https://fonts.googleapis.com/css2?family=Grape+Nuts&family=Poppins:wght@300;400;600&family=Work+Sans:wght@300;400;600&family=Bricolage+Grotesque:wght@400;500;600;700&display=swap',
  meta: {
    keywordsContent:
      `appointment scheduling,
      calendar sync,
      team scheduling,
      schedule management,
      appointment booking,
      collaborative calendar,
      scheduling conflicts,
      real-time scheduling,
      calendar integration,
      appointment management,
      multi-user scheduling,
      schedule coordination,
      appointment software,
      calendar app,
      booking system,
      scheduling tool,
      appointment platform,
      calendar synchronization,
      scheduling solution,
      team calendar`,
  },
  ogImage: LOGO_PNG,
  ogUrl: WEBSITE_URL,
  ogType: 'website',
  icon: LOGO_PNG,
}

const Email = {
  supportEmail: 'hi@lutfifadlan.com',
  infoDestinationEmail: 'mochamadlutfifadlan@gmail.com',
}

const Launch = {
  Date: 'June 16, 2025',
}


export { Common, Document, Email, Launch };