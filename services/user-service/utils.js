const USER_FIELDS = Object.freeze({
    id: '_id',
    name: 'name',
    password: 'password',
    answers: 'answers',
    parameters: "parameters",
    elo: "elo",
    league: "league",
    friends: "friends"
});

const DATABASE_ERRORS = Object.freeze({
    USER_NOT_FOUND: "USER_NOT_FOUND",
    TOKEN_GENERATION_FAILED: "TOKEN_GENERATION_FAILED",
    TOKEN_NOT_FOUND: "TOKEN_NOT_FOUND",
    TOKEN_INSERT_FAILED: "TOKEN_INSERT_FAILED",
    INVALID_PASSWORD: "INVALID_PASSWORD",
    NO_REFRESH_TOKEN: "NO_REFRESH_TOKEN",
    SECURITY_ANSWERS_MISMATCH: "SECURITY_ANSWERS_MISMATCH",
    USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
    VALIDATION_FAILED: "VALIDATION_FAILED"
});

/**
 * The friendship statuses are as follows:
 *  - "requested": User A has sent a friend request to User B, and it is waiting for acceptance.
 *  - "pending": User B has received the request and is expected to accept or decline it.
 *  - "friend": Both users are now friends after accepting the request.
 */
const FRIENDSHIP_STATUS = Object.freeze({
    REQUESTED: "requested",
    PENDING: "pending",
    FRIENDS: "friends"
});

module.exports = {
    USER_FIELDS,
    DATABASE_ERRORS,
    FRIENDSHIP_STATUS
};