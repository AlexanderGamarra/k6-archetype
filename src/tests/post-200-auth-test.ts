import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import http from 'k6/http';
import Papa from 'papaparse';

const users = new SharedArray('user credentials', function () {
    const csvFile = open('./users.csv');
    return Papa.parse(csvFile, {
        header: true,         // Use the first row as keys (username, password)
        skipEmptyLines: true  // Clean up any trailing newlines
    }).data;
});

export const options = {
  stages: [
    { duration: '30s', target: 40 }, 
    { duration: '1m', target: 40 },  
    { duration: '30s', target: 0 },  
  ],
  thresholds: {
    http_req_duration: ['max<1500'],
    http_req_failed: ['rate<0.03'],   
  },
};

export default () => {
  const user = users[__ITER % users.length];
  const payload = JSON.stringify({
        username: user.username,  
        password: user.password   
    });
  const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
  const res = http.post('https://api.demoblaze.com/login', payload, params);
  check(res, {
    'status is 200': () => res.status === 200,
    'success authentication successful': () => res.body.includes('Auth_token:'),
  });
  sleep(1);
};

export function handleSummary(data){
  return {
    "sumary.html": htmlReport(data)
  };
}