DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS loggedin;

CREATE TABLE user(email VARCHAR(50) NOT NULL PRIMARY KEY,
                                password VARCHAR(50) NOT NULL,
                                firstname VARCHAR(50),
                                familyname VARCHAR(50),
                                gender VARCHAR(50),
                                city VARCHAR(50),
                                country VARCHAR(50)
                                );

CREATE TABLE messages(email VARCHAR(50),
                                    to_email VARCHAR(50),
                                    message VARCHAR(50)
                                    );



CREATE TABLE loggedin (email VARCHAR(50) NOT NULL,
                                    token VARCHAR(50) NOT NULL PRIMARY KEY
                                    );
