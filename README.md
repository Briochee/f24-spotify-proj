# SUBSONIC
##### A Song Quiz by Yana Kuzmina and Rio Simpson
This application allows users to create accounts (no personal data is used outside 
the scope of the application), connect to their spotify account, retrieve their playlists,
and generate a quiz based on their very own songs and parameters they set such as the number
of songs in the quiz and the difficulty of the quiz.

## Frontend
The frontend of our application uses a ReactJS Framework, JS, and CSS
We use Axios for API and backend calls to our server for ease of debugging and output organization

## Backend
The backend of our application uses ExpressJS and NodeJS to execute CRUD functions with our MongoDB atlas
server, in that we use it to update and retrieve data from our server.
Additionally, ExpressJS and NodeJS are used to establish/verify API connections and send API requests.

## Data Persistence
Several data values are stored in local storage, the browers local storage on a users machine and will remain persistent until said storage is cleared.
Other data, specified by our Schema model is stored via the MongoDB Atlas server. The data in itself are details needed to establish/refresh a connection
with the Spotify API, sign the user into their account on our application, and statistics from the quizzes they take

## API
Our API of choice was the Spotify Web API and Spotify Playback SDK. The order of their implementation/use is as follows:
- Connect Spotify Application (SUBSONIC, registered with Spotify for Developers)
    - Received Client ID and Client Secret 
- Connect User's Spotify account to our application
- Verify connection when necessarcy -- use refresh token to retrieve new tokens when needed
- Uses web API and user account to fetch user's playlists, their songs, and corresponding metadata such as names of songs, artists, and album covers
- For the purpses of the game, the user is able to play a snippet of the song that is randomly chosen
    - Spotify's playback SDK is used by establishing a connection via the user's account and the SDK
    - The SDK provides a sample that is use for the purpose of the game
        - NOTE: Spotify limits the number of requests a user can make within a 30 second window, a 429 error is sent to the user and is supposed to have
          a "Retry-after" value, though it has been missing from the call response. We implemented an exponential wait time with a limit of 5 retries
- Game continues, user data is updated to MongoDB server

## Technical Overview
- MongoDB Atlas: hosts minimal server through AWS, provides cloud data storage
- Mongoose: used in tandem with NodeJS to define and simplify interactions with MongoDB schema
- Jsonwebtoken: library used for simplifying a user's session token when logged in and implementation of authentification middleware
- Axios: sending requests and receiving data from both our API and MongoDB server
- ExpressJS: manages backend routing of application
- ReactJS: framework used for frontend of application, subsequent libraries and tools used
- Cors: tool used for resource sharing between frontend and backend in cross-origin requests
- Querystring: used to simplify routing to different webpages while passing non-sensitive data
- Body-parser: library used strictly in front-end to decode token when needed
- Openssl: used to generate JWT secret

# HOW TO RUN
- Create a [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) Account and create a new cluster
    - Find the "connect" option and navigate to "drivers"
    - Copy the URI and replace <username> and <password> with the credentials of a user in "Database Access"
    - Optional: allow access from any IP in "Network Access", IP where cluster is created is added by default
    - Optional: Install [MongoDB CLI](https://www.mongodb.com/try/download/atlascli) to manage cluster
- Create a [Spotify Developer](https://developer.spotify.com/) account and application
    - Specify the intended use of the Web APi and Playback SDK
    - Choose a name for the application
    - Enter a redirect uri: <backend url>/api/spotify/callback
        - ex. http://localhost:5000/api/spotify/callback
    - Agree to terms, save
    - Navigate to Settings and User Management, add name and email associated with Premium Spotify Account (SDK can only work with a Premium account)
- Copy the git link to this repository
    - Open a terminal in a directory of choice
    - Enter "git clone <link>" to the terminal
    - cd client
          - create .env file and enter the following field
      
              # Client .env
              REACT_APP_BACKEND_URL=<link to backend server>
    - cd ..
    - cd server
          - create .env file and enter the following field
      
              # Server .env
              REACT_BACKEND_URL=<link to backend server>
              FRONTEND_URL=<link to frontend>
              MONGO_URI=<MongoDB atlas URI>
              JWT_SECRET=<Generated JWT secret -- use "openssl rand -hex 64" in a terminal>
              SPOTIFY_REDIRECT_URI=<redirect uri from before>
              SPOTIFY_CLIENT_ID=<client id from before>
              SPOTIFY_CLIENT_SECRET=<client secret from before>
              PORT=<port where backend is being hosted>

- cd .. (you should now be in the root directory)
- Enter "npm install" into your terminal
- Enter "npm run start" into your terminal

## Breakdown of Project Contributions
- Rio:
    - Backend, implemented /models /controllers /config /routes /auth
    - Frontend, implemented /gamebar /homepage /login /navigate /profile /quiz /spotify
- Yana:
    - Frontend, implemented CSS, modified webpage files where necessarcy
    - Frontend, Implemented /quiz /spotify /gamebar /naviage
    - Collaborated in design of backend and frontend functions
      
