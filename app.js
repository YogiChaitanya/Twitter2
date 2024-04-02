const express = require('express')
const path = require('path')

// data base related modules
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

// password related modules
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// access the database purpose
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'twitterClone.db')
let db = null

const initiallizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running at https://yogichaitanyapncjfnjscadijbi.drops.nxtwave.tech:3000/',
      )
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}
initiallizeDBAndServer()

// API 1
// all response we did not got the response
// api 1 related all test cases are passed
app.post('/register/', async (request, response) => {
  const {username, password, name, gender} = request.body
  const getUserQuery = `
  SELECT * 
  FROM user 
  WHERE username='${username}';`
  const dbUser = await db.get(getUserQuery)

  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400)
      response.send('Password is too short')
    } else {
      // create new user
      const hashedPassword = await bcrypt.hash(request.body.password, 11)
      const newUserQuery = `
      INSERT INTO
       user(username, password, name, gender) 
      VALUES('${username}', '${hashedPassword}', '${name}', '${gender}')`

      await db.run(newUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API 2
// all response we did not got the response
// api 2 realated test cases are passed
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const getUserQuery = `
  SELECT * 
  FROM user 
  WHERE username='${username}';`
  const dbUser = await db.get(getUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    // check the password
    const checkThePassword = await bcrypt.compare(password, dbUser.password)
    if (checkThePassword === true) {
      // we need to get the JWT Token
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// Authentication with JWT Token
// API3 to API11 responses i am getting invalid JWT Token
const authenticate = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    // verify the jwt token
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}

// API 3
// i got the response invalid jwt token
app.get('/user/tweets/feed/', authenticate, async (request, response) => {
  const get4Tweets = `
      SELECT 
        * 
      FROM 
        follower INNER JOIN 
        tweet 
      WHERE 
        following_user_id = user_id
      ORDER BY
        user_id 
      LIMIT 
        4 
      OFFSET 
        4`

  const fourTweetsAtATime = await db.all(get4Tweets)
  response.send(fourTweetsAtATime)
})

// API 4
// invalid jwt token
app.get('/user/following/', authenticate, async (request, response) => {
  const getFollowersList = `
    SELECT * 
    FROM follower 
    WHERE name='Narendra Modi'`
  const namesOfPeoples = await db.all(getFollowersList)
  response.send(namesOfPeoples)
})

// API 5
// invalid jwt token
app.get('/user/followers/', authenticate, async (request, response) => {
  const getWhoFolowsTheUser = `
    SELECT * 
    FROM follower 
    WHERE name='Narendra Modi'`
  const allNames = await db.all(getWhoFolowsTheUser)
  response.send(allNames)
})

// API 6
app.get('/tweets/:tweetId/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const getTweet = `
    SELECT * 
    FROM tweet 
    WHERE tweet_id=${tweetId}`
  const dbUser = await db.get(getTweet)

  if (dbUser === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const convertDBRequestToDBObject = dbObject => {
      return {
        tweet: dbObject.tweet,
        likes: dbObject.likes,
        replies: dbObject.replies,
        dateTime: dbObject.date_time,
      }
    }
    const result = convertDBRequestToDBObject(dbUser)
    response.send(result)
  }
})

// API 7
app.get('/tweets/:tweetId/likes/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const getUsernamesWhoLiked = `
    SELECT 
      * 
    FROM 
      tweet 
    WHERE 
      tweet_id=${tweetId}`
  const dbUser = await db.all(getUsernamesWhoLiked)
  if (dbUser === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    response.send(dbUser)
  }
})

// API 8
app.get(
  '/tweets/:tweetId/replies/',
  authenticate,
  async (request, response) => {
    const {tweetId} = request.params
    const returnTheListOfReplies = `
    SELECT 
      * 
    FROM 
      tweet
    WHERE 
      tweet_id=${tweetId}`
    const dbUser = await db.all(returnTheListOfReplies)
    if (dbUser === undefined) {
      response.status(401)
      response.send('Invalid Request')
    } else {
      response.send(dbUser)
    }
  },
)

// API 9
app.get('/user/tweets/', authenticate, async (request, response) => {
  const getAllTweets = `
  SELECT 
    * 
  FROM 
    tweet
  ORDER BY 
    user_id`

  const allTweets = await db.all(getAllTweets)
  response.send(allTweets)
})

// API 10
app.post('/user/tweets/', authenticate, async (request, response) => {
  const {tweet} = request.body
  const updateTheTweet = `
  INSERT INTO tweet(tweet) 
  VALUES('${tweet}')`

  await db.run(updateTheTweet)
  response.send('Created a Tweet')
})

// API 11
app.delete('/tweets/:tweetId/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const getTweetId = `
    SELECT * 
    FROM tweet 
    WHERE tweet_id=${tweetId}`
  const dbUser = await db.get(getTweetId)

  if (dbUser === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const deleteTweetId = `
      DELETE 
      FROM tweet 
      WHERE tweet_id=${tweetId}`

    await db.run(deleteTweetId)
    response.send('Tweet Removed')
  }
})

module.exports = app
