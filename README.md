# SUBSONIC
##### A Song Quiz by Yana Kuzmina and Rio Simpson
This application allows users to create accounts (no personal data is used outside the scope of the application), connect to their Spotify account, retrieve their playlists, and generate a quiz based on their very own songs and parameters they set, such as the number of songs in the quiz and the difficulty of the quiz.

## Frontend
The frontend of our application uses a ReactJS framework, JavaScript, and CSS.  
We use Axios for API and backend calls to our server for ease of debugging and output organization.

## Backend
The backend of our application uses ExpressJS and NodeJS to execute CRUD functions with our MongoDB Atlas server, which we use to update and retrieve data from our server.  
Additionally, ExpressJS and NodeJS are used to establish/verify API connections and send API requests.

## Data Persistence
Several data values are stored in local storage, the browser's local storage on a user's machine, and will remain persistent until said storage is cleared.  
Other data, specified by our Schema model, is stored via the MongoDB Atlas server. The data includes details needed to establish/refresh a connection with the Spotify API, sign the user into their account on our application, and statistics from the quizzes they take.

## API
Our API of choice was the Spotify Web API and Spotify Playback SDK. The order of their implementation/use is as follows:
- Connect Spotify Application (SUBSONIC, registered with Spotify for Developers)
    - Received Client ID and Client Secret 
- Connect the user's Spotify account to our application.
- Verify the connection when necessary — use the refresh token to retrieve new tokens when needed.
- Use the Web API and user account to fetch the user's playlists, their songs, and corresponding metadata such as song names, artists, and album covers.
- For the purposes of the game, the user is able to play a snippet of the song that is randomly chosen:
    - Spotify's Playback SDK is used by establishing a connection via the user's account and the SDK.
    - The SDK provides a sample used for the purpose of the game.
        - NOTE: Spotify limits the number of requests a user can make within a 30-second window. A 429 error is sent to the user and is supposed to have a "Retry-after" value, though it has been missing from the call response. We implemented an exponential wait time with a limit of 5 retries.
- The game continues, and user data is updated to the MongoDB server.

## Technical Overview
- **MongoDB Atlas**: Hosts a minimal server through AWS, provides cloud data storage.
- **Mongoose**: Used in tandem with NodeJS to define and simplify interactions with the MongoDB schema.
- **Jsonwebtoken**: Library used for simplifying a user's session token when logged in and implementing authentication middleware.
- **Axios**: Sends requests and receives data from both our API and MongoDB server.
- **ExpressJS**: Manages backend routing of the application.
- **ReactJS**: Framework used for the frontend of the application; includes subsequent libraries and tools.
- **CORS**: Tool used for resource sharing between frontend and backend in cross-origin requests.
- **Querystring**: Simplifies routing to different webpages while passing non-sensitive data.
- **Body-parser**: Library used strictly in the frontend to decode the token when needed.
- **OpenSSL**: Used to generate the JWT secret.

## HOW TO RUN
1. Create a [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) account and a new cluster:
    - Find the "Connect" option and navigate to "Drivers."
    - Copy the URI and replace `<username>` and `<password>` with the credentials of a user in "Database Access."
    - Optional: Allow access from any IP in "Network Access." The IP where the cluster is created is added by default.
    - Optional: Install the [MongoDB CLI](https://www.mongodb.com/try/download/atlascli) to manage the cluster.
2. Create a [Spotify Developer](https://developer.spotify.com/) account and application:
    - Specify the intended use of the Web API and Playback SDK.
    - Choose a name for the application.
    - Enter a redirect URI: `<backend url>/api/spotify/callback`  
      Example: `http://localhost:5000/api/spotify/callback`
    - Agree to terms and save.
    - Navigate to Settings and User Management, and add the name and email associated with a Premium Spotify account (the SDK works only with a Premium account).
3. Clone this repository:
    - Open a terminal in a directory of your choice.
    - Enter `git clone <link>` in the terminal.
4. Set up the client:
    - `cd client`
    - Create a `.env` file and enter the following fields:
      ```plaintext
      # Client .env
      REACT_APP_BACKEND_URL=<link to backend server>
      ```
    - Return to the root directory: `cd ..`
5. Set up the server:
    - `cd server`
    - Create a `.env` file and enter the following fields:
      ```plaintext
      # Server .env
      REACT_BACKEND_URL=<link to backend server>
      FRONTEND_URL=<link to frontend>
      MONGO_URI=<MongoDB Atlas URI>
      JWT_SECRET=<Generated JWT secret — use "openssl rand -hex 64" in a terminal>
      SPOTIFY_REDIRECT_URI=<redirect URI from before>
      SPOTIFY_CLIENT_ID=<client ID from before>
      SPOTIFY_CLIENT_SECRET=<client secret from before>
      PORT=<port where the backend is being hosted>
      ```
6. Return to the root directory: `cd ..`
7. Install dependencies:
    ```bash
    npm install
    ```
8. Start the application:
    ```bash
    npm run start
    ```

## Breakdown of Project Contributions
- **Rio**:
    - Backend: Implemented `/models`, `/controllers`, `/config`, `/routes`, `/auth`.
    - Frontend: Implemented `/gamebar`, `/homepage`, `/login`, `/navigate`, `/profile`, `/quiz`, `/spotify`.
- **Yana**:
    - Frontend: Implemented CSS, modified webpage files where necessary.
    - Frontend: Implemented `/quiz`, `/spotify`, `/gamebar`, `/navigate`.
    - Collaborated in designing backend and frontend functions.
