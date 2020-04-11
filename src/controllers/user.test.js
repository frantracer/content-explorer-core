const user = require("./user");
const db = require("../controllers/database");

describe('user controller should', () => {
    it('retrieves an user from the databaes based on user id', done => {

        const findOne = (query) => Promise.resolve({ sid: query.sid });
        const collection = () => ({ findOne });
        db.dbc = () => ({ collection });

        user.getUserBySid("A_USER_ID").then(user => {
            expect(user.sid).toBe("A_USER_ID");
            done();
        });
    })
});
