const axios = require('axios');
const fs = require('fs');
const moment = require('moment');

// Defines my GitHub username
const username = 'Dwukn';  

// Define the GitHub API endpoint and GraphQL query to get the contribution data
const apiUrl = 'https://api.github.com/graphql';
const query = `
  {
    user(login: "${username}") {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
            }
          }
        }
      }
    }
  }
`;

// Function to fetch contribution data from GitHub
async function fetchContributionData() {
  try {
    const response = await axios.post(apiUrl, {
      query
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
      }
    });

    return response.data.data.user.contributionsCollection.contributionCalendar.weeks;
  } catch (error) {
    console.error('Error fetching contribution data:', error);
    process.exit(1);
  }
}

// Function to find the longest streak
function findLongestStreak(contributionDays) {
  let longestStreak = [];
  let currentStreak = [];

  for (let i = 0; i < contributionDays.length; i++) {
    const currentDay = moment(contributionDays[i]);
    if (i === 0) {
      currentStreak.push(currentDay);
    } else {
      const prevDay = moment(contributionDays[i - 1]);
      if (currentDay.diff(prevDay, 'days') === 1) {
        currentStreak.push(currentDay);
      } else {
        if (currentStreak.length > longestStreak.length) {
          longestStreak = currentStreak;
        }
        currentStreak = [currentDay];
      }
    }
  }

  if (currentStreak.length > longestStreak.length) {
    longestStreak = currentStreak;
  }

  return longestStreak;
}

// Function to update the README with the streak data
function updateReadme(streakDates) {
  const readmePath = 'README.md';

  // Read the current README content
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');

  // Define the streak section to insert into the README
  const streakSection = `
## GitHub Contribution Streak

**Longest Streak:** ${streakDates.length} days

Streak Dates:
${streakDates.map(date => `- ${date}`).join('\n')}
  `;

  // Find the placeholder in the README and replace it with the streak section
  const updatedReadme = readmeContent.replace('<!-- streak-placeholder -->', streakSection);

  // Write the updated content back to the README
  fs.writeFileSync(readmePath, updatedReadme);
}

// Main function to process and update the streak
async function main() {
  const contributionWeeks = await fetchContributionData();

  // Flatten the contribution days from weeks and extract the dates
  const contributionDays = contributionWeeks.flatMap(week => week.contributionDays)
                                            .map(day => day.date);

  // Find the longest streak from the contribution days
  const longestStreak = findLongestStreak(contributionDays);

  // Format the streak dates in dd-mm-yyyy format
  const formattedStreak = longestStreak.map(day => moment(day).format('DD-MM-YYYY'));

  // Update the README with the streak information
  updateReadme(formattedStreak);
}

// Run the main function
main();
