/**
 * Purpose-built name pools for synthetic staging data.
 *
 * Common given names and surnames grouped by region, combined at random, so
 * every generated person is fictional. Nothing here is scraped or copied from
 * a real person's record. ~99% Indian across regions, ~1% global.
 */

export type NamePool = {
  region: string;
  weight: number;
  male: readonly string[];
  female: readonly string[];
  surnames: readonly string[];
  /** Surnames used only with female first names (e.g. Kaur). */
  femaleSurnames?: readonly string[];
};

export const INDIAN_POOLS: readonly NamePool[] = [
  {
    region: "north",
    weight: 26,
    male: ["Aarav", "Aditya", "Akash", "Aman", "Ankit", "Arjun", "Ayush", "Deepak", "Gaurav", "Harsh", "Hrithik", "Ishaan", "Kartik", "Kunal", "Manish", "Mohit", "Nikhil", "Pranav", "Rahul", "Rajat", "Rohit", "Sachin", "Sahil", "Sarthak", "Shivam", "Siddharth", "Tushar", "Utkarsh", "Varun", "Vikas", "Vivek", "Yash", "Abhishek", "Anmol", "Devansh", "Lakshay", "Raghav", "Saurabh", "Vaibhav", "Ritesh"],
    female: ["Aanya", "Aditi", "Ananya", "Anjali", "Divya", "Isha", "Kavya", "Khushi", "Kriti", "Muskan", "Neha", "Nidhi", "Pooja", "Priya", "Riya", "Sakshi", "Shreya", "Simran", "Sneha", "Tanvi", "Urvashi", "Vanshika", "Shruti", "Pallavi", "Ritika", "Ira", "Diya", "Aakriti", "Mansi", "Palak", "Garima", "Jhanvi", "Ishita", "Avni"],
    surnames: ["Sharma", "Verma", "Gupta", "Singh", "Mishra", "Tiwari", "Pandey", "Yadav", "Shukla", "Srivastava", "Agarwal", "Chauhan", "Saxena", "Tripathi", "Dubey", "Jain", "Rastogi", "Bhatt", "Kapoor", "Malhotra", "Khanna", "Chopra", "Arora", "Sethi", "Bansal", "Goyal", "Mittal", "Rathore", "Thakur", "Negi"],
  },
  {
    region: "punjab",
    weight: 6,
    male: ["Gurmeet", "Harpreet", "Jaspreet", "Manpreet", "Simranjit", "Gurpreet", "Navjot", "Amandeep", "Harjot", "Rajveer", "Karanveer", "Jasraj"],
    female: ["Gurleen", "Harleen", "Jasleen", "Navneet", "Simranpreet", "Prabhjot", "Gurmeet", "Manpreet", "Rupinder", "Amrit"],
    surnames: ["Singh", "Gill", "Sandhu", "Dhillon", "Grewal", "Bajwa", "Sidhu", "Brar", "Randhawa", "Virk"],
    femaleSurnames: ["Kaur"],
  },
  {
    region: "gujarat",
    weight: 7,
    male: ["Dhruv", "Hardik", "Jay", "Kunj", "Parth", "Nirav", "Chirag", "Jigar", "Meet", "Harshil", "Krunal", "Rushil"],
    female: ["Hetal", "Krupa", "Dhwani", "Janvi", "Riddhi", "Khushali", "Foram", "Nirali", "Hiral", "Disha"],
    surnames: ["Patel", "Shah", "Mehta", "Desai", "Joshi", "Parikh", "Modi", "Trivedi", "Panchal", "Thakkar", "Vora", "Gandhi"],
  },
  {
    region: "maharashtra",
    weight: 11,
    male: ["Aniket", "Omkar", "Prathamesh", "Sagar", "Swapnil", "Tejas", "Akshay", "Shubham", "Ninad", "Rohan", "Atharva", "Soham", "Chinmay"],
    female: ["Aishwarya", "Gauri", "Mrunal", "Pranali", "Rutuja", "Sayali", "Shravani", "Tejaswini", "Ketaki", "Sanika", "Manasi"],
    surnames: ["Patil", "Deshmukh", "Kulkarni", "Joshi", "Pawar", "Jadhav", "Shinde", "Gaikwad", "Kale", "Bhosale", "Deshpande", "More", "Mehta", "Naik"],
  },
  {
    region: "bengal",
    weight: 8,
    male: ["Arnab", "Debanjan", "Sayan", "Soumya", "Subhajit", "Anirban", "Arijit", "Rajdeep", "Sourav", "Ritam", "Abhirup"],
    female: ["Ankita", "Debolina", "Moumita", "Payel", "Rituparna", "Sohini", "Tanushree", "Srijita", "Oindrila", "Ishani"],
    surnames: ["Banerjee", "Chatterjee", "Mukherjee", "Das", "Ghosh", "Bose", "Sen", "Dutta", "Roy", "Chakraborty", "Bhattacharya", "Saha", "Mondal"],
  },
  {
    region: "tamil",
    weight: 8,
    male: ["Arun", "Karthik", "Prakash", "Sanjay", "Senthil", "Vignesh", "Dinesh", "Gokul", "Hari", "Naveen", "Surya", "Aravind"],
    female: ["Deepika", "Gayathri", "Janani", "Kavitha", "Lakshmi", "Nandhini", "Priyanka", "Revathi", "Swetha", "Harini", "Keerthana"],
    surnames: ["Iyer", "Raman", "Krishnan", "Subramanian", "Natarajan", "Venkatesan", "Murugan", "Pillai", "Rajan", "Sundaram", "Balasubramanian", "Raghavan"],
  },
  {
    region: "telugu",
    weight: 8,
    male: ["Chaitanya", "Harsha", "Kiran", "Mahesh", "Pavan", "Raghu", "Sai", "Srinivas", "Teja", "Vamsi", "Rakesh"],
    female: ["Bhavana", "Harika", "Keerthi", "Lavanya", "Madhuri", "Sahithi", "Sravani", "Tejaswi", "Mounika", "Sindhu"],
    surnames: ["Reddy", "Rao", "Naidu", "Chowdary", "Varma", "Raju", "Goud", "Kumar", "Yadav"],
  },
  {
    region: "karnataka",
    weight: 5,
    male: ["Darshan", "Manjunath", "Prajwal", "Rakshith", "Shreyas", "Sudeep", "Nithin", "Pradeep"],
    female: ["Bhoomika", "Chaitra", "Rachana", "Spoorthi", "Ananya", "Sinchana", "Deeksha"],
    surnames: ["Gowda", "Hegde", "Shetty", "Rao", "Bhat", "Kamath", "Prabhu", "Shenoy"],
  },
  {
    region: "kerala",
    weight: 5,
    male: ["Abhijith", "Akhil", "Jithin", "Sreejith", "Vishnu", "Anand", "Arjun", "Gokul"],
    female: ["Anjana", "Aparna", "Athira", "Gopika", "Sreelakshmi", "Aswathy", "Anagha"],
    surnames: ["Nair", "Menon", "Pillai", "Kurup", "Varghese", "Thomas", "Kurian", "Nambiar", "Joseph"],
  },
  {
    region: "east-northeast",
    weight: 5,
    male: ["Ashutosh", "Debasish", "Sambit", "Bikash", "Pranjal", "Bhaskar", "Lalit", "Dipankar"],
    female: ["Ipsita", "Subhashree", "Barsha", "Nilakshi", "Pragya", "Rimjhim", "Sushmita"],
    surnames: ["Mohanty", "Panda", "Patnaik", "Sahoo", "Das", "Baruah", "Bora", "Gogoi", "Kalita", "Hazarika", "Jha", "Sinha"],
  },
  {
    region: "urdu",
    weight: 9,
    male: ["Aamir", "Arif", "Faizan", "Imran", "Irfan", "Mohammed", "Rehan", "Sameer", "Zaid", "Zaheer", "Ayaan", "Saif"],
    female: ["Ayesha", "Fatima", "Mehreen", "Nazia", "Sana", "Zainab", "Alina", "Afreen", "Iqra", "Zoya"],
    surnames: ["Khan", "Sheikh", "Ansari", "Qureshi", "Siddiqui", "Syed", "Mirza", "Hussain", "Pathan", "Rizvi"],
  },
  {
    region: "goa-christian",
    weight: 2,
    male: ["Aaron", "Ryan", "Joel", "Kevin", "Glen", "Nigel"],
    female: ["Sharon", "Reena", "Nisha", "Joanna", "Crystal"],
    surnames: ["D'Souza", "Fernandes", "Pereira", "Rodrigues", "Lobo", "Pinto", "D'Costa", "Gomes"],
  },
];

export const GLOBAL_POOL: NamePool = {
  region: "global",
  weight: 1,
  male: ["Liam", "Noah", "Lucas", "Mateo", "Kenji", "Daniel", "Omar", "Wei", "Ethan", "Tomas"],
  female: ["Emma", "Olivia", "Mia", "Sofia", "Yuki", "Amara", "Hannah", "Elena", "Layla", "Chloe"],
  surnames: ["Smith", "Garcia", "Tanaka", "Muller", "Rossi", "Kim", "Nguyen", "Okafor", "Silva", "Novak", "Chen", "Haddad"],
};

/** ~1% global: Indian pool weights sum to 100, global weight 1. */
export const ALL_POOLS: readonly NamePool[] = [...INDIAN_POOLS, GLOBAL_POOL];
