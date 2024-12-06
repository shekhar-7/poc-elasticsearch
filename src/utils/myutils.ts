export function getRandomRole() {
    // Get all values of the enum
    const roles = Object.values({
        WEDDING : 'wedding',
        PHOTOGRAPHY : 'photography',
        CONTENT_CREATION : 'content-creation',
    });
    
    // Pick a random index
    const randomIndex = Math.floor(Math.random() * roles.length);
    
    // Return the random role
    return roles[randomIndex];
  }

export function getRandomNumber(min:any, max:any) {
    if (min > max) {
        throw new Error("Min value cannot be greater than max value.");
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomString(n:any=30, charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
  if (n <= 0) {
      throw new Error("Length must be a positive iˀnteger.");
  }

  let result = "";
  const charSetLength = charSet.length;

  for (let i = 0; i < n; i++) {
      const randomIndex = Math.floor(Math.random() * charSetLength);
      result += charSet[randomIndex];
  }

  return result;
}
