# nse-promoter-buying

A Node.js app to get the list of promoter buyers in recent (max 6 Months) times.

## Execution steps
--------------------
1. Goto website https://www.nseindia.com/companies-listing/corporate-filings-insider-trading
2. Select either 1D [1 day], 1W [1 week], 1M [1 month], 3M [3 months] or 6M [6 months] report.
3. Once the data is display, come to the project terminal and execute command `node index <DURATION>` where `DUARTION` can be 1D, 1W, 1M, 3M or 6M
4. possible combinations to execute the command can be `node index 1D` OR `node index 1M` OR `` OR `` OR `` OR ``
4. You should be able to see something as below.
<a href="https://github.com/ankurksoni/nse-promoter-buying"><img width="100%" height="auto" src="./result.png" /></a>