## REACT APP (Frontend)

## ========================================

Data Structure:

- LocationData location
- string name
- int privacyLevel
  @ 1 for exact location, 2 for city level, 3 for country level

- frinds: [frind1,frind2, ...]
  for each friend :
  - LocationDatals location
  - string name

## ROFL (Backend API)

## ========================================

Constructor:

- createUser(string userId,string name,LocationData location,int_8 privacyLevel)
- verify(string userId)

Methods:

- updateUserLocation(string userId,LocationData location)
  \*We need to think this logic to make saphire compatible

- addAFriend(userId, friendId)

- removeFriend(userId, friendId)

- lookFriendLocation(friend id)
  \*Use TEE

- changePrivacyLevel()
  @if you have privacyLevel: 1 coordinates, 2 return city, 3 country

""

- readUser(userId)
  \*this coms with cello to read the user data (id,nationality, age, name, lastName)
  ""

## TEE save

## ========================================

Data Structure:

struct {
userID: "54146",
name: "juan",
PrivaciLevel: "2",
location: [32.1, 33.2]
friends: [
Friend1ID: "54146",
Friend2ID: "54637",
Friend3ID: "46146",

....
]
}
