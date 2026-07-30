const request=require("supertest");
const app=require("../src/app");
const prisma=require("../src/utils/prisma");
const bcrypt = require("bcryptjs");

describe("POST /api/auth/register", ()=>{
    test('register should be successfull', async () => {
      
        const newUser={
            name:"john",
            email:"john@example.com",
            password:"password12",
        };

        const response=await request(app)
          .post("/api/auth/register")
          .send(newUser);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("token");
        expect(response.body.user).toEqual({
            id:expect.any(String),
            name:newUser.name,
            email:newUser.email,
            role:"STUDENT",

        });

        const userInDb=await prisma.user.findUnique({
            where:{email:newUser.email},
        });

        expect(userInDb).not.toBeNull();
        expect(userInDb.name).toBe(newUser.name);
        expect(userInDb.email).toBe(newUser.email);
        expect(userInDb.role).toBe("STUDENT");
        expect(userInDb.password).not.toBe(newUser.password);


    });
    
    test("should not register with an existing email", async () => {

    const existingUser = await prisma.user.create({
      data: {
        name: "John",
        email: "john@example.com",
        password: "hashedPassword",
        role: "STUDENT",
      },
    });

    const newUser = {
      name: "John Updated",
      email: existingUser.email,
      password: "Password123",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(newUser);

    expect(response.status).toBe(409);

    expect(response.body.message).toBe("Email already registered");

    const users = await prisma.user.findMany({
      where: {
        email: existingUser.email,
      },
    });

    expect(users).toHaveLength(1);
  });

  test("should return 400 if name is missing", async () => {
  const newUser = {
    email: "john@example.com",
    password: "Password@123",
  };

  const response = await request(app)
    .post("/api/auth/register")
    .send(newUser);

  expect(response.status).toBe(400);

  expect(response.body).toEqual({
    message: "Missing required fields",
  });
});

test("should return 400 if email is missing", async () => {
  const newUser = {
    name: "John Doe",
    password: "Password@123",
  };

  const response = await request(app)
    .post("/api/auth/register")
    .send(newUser);

  expect(response.status).toBe(400);

  expect(response.body).toEqual({
    message: "Missing required fields",
  });
});

test("should return 400 if password is missing", async () => {
  const newUser = {
    name: "John Doe",
    email: "john@example.com",
  };

  const response = await request(app)
    .post("/api/auth/register")
    .send(newUser);

  expect(response.status).toBe(400);

  expect(response.body).toEqual({
    message: "Missing required fields",
  });
});

});


describe("POST /api/auth/login", () => {

    test("should login successfully with valid credentials", async () => {

        const hashedPassword = await bcrypt.hash("password123", 10);

        await prisma.user.create({
            data: {
                name: "John Doe",
                email: "john@example.com",
                password: hashedPassword,
                role: "STUDENT"
            }
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "john@example.com",
                password: "password123"
            });

        expect(response.status).toBe(200);

        expect(response.body).toHaveProperty("token");

        expect(response.body.user.email).toBe("john@example.com");
        expect(response.body.user.name).toBe("John Doe");
        expect(response.body.user.role).toBe("STUDENT");
    });

    test("should return 401 if email does not exist", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "unknown@example.com",
                password: "password123"
            });

        expect(response.status).toBe(401);

        expect(response.body.message).toBe("Invalid credentials");
    });

    test("should return 401 if password is incorrect", async () => {

        const hashedPassword = await bcrypt.hash("password123", 10);

        await prisma.user.create({
            data: {
                name: "John Doe",
                email: "john@example.com",
                password: hashedPassword,
                role: "STUDENT"
            }
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "john@example.com",
                password: "wrongpassword"
            });

        expect(response.status).toBe(401);

        expect(response.body.message).toBe("Invalid credentials");
    });

});
