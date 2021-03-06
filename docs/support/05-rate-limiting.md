## Rate limiting

Rate limits ensure that CARTO platform is not flooded with so many requests it does not have the time and resources to service them all.

Of course, there is nothing we can do to prevent people from actually sending as many requests to our platform as they want, but requests over a user's rate limit will be acknowledged with an error so that the sender understands they need to lower the rate at which requests are sent before they are serviced again.

Currently, SQL API is affected by rate limiting.

### Per user and endpoint

Rate limit is on a per-user basis (or more accurately described, per user access) and by endpoint. For example, suppose you have 2 different apps (with 2 different maps) and both call to the same endpoint that allows 100 requests per second. Both apps/maps "share" 100 requests per second regardless the map calling to this endpoint.


### How it works

We are using the [generic cell rate algorithm](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm), a [leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket) algorithm type.

The main keys to keep in mind about this algorithm and our implementation are:
- We allow a request every a certain time period
```
If an endpoint has a limit of 5 requests per second, you will have a request available every 200ms and when you spend all the available requests, you will need to wait 200ms to have another available request, instead of 1 second
```
- Most of the endpoints are limited per second
```
If an endpoint has a limit of 5 requests per second, after a second without requests, you will have at least 5 available requests
```
- Most of the endpoints allow an initial burst equal to the number of requests per second
```
If an endpoint has a limit of 5 requests per second, initially you will have 5 available requests
```

### Caches

In computing, a cache is a high-speed data storage layer which stores data, typically a set of data, so that future requests for that data are served up faster than by accessing the original location.

CARTO caching allows you to efficiently reuse previously retrieved or computed data, as the data in a cache is stored by CARTO in fast access hardware in combination with specific software to manage this.

Resources accessed by caches don't count against the limits. That is, any request that is handled by any cache layer is out of limits. You can always know which resources are served through cache looking at the `X-Cache` HTTP Header.


### HTTP Headers and Response Codes

When an application exceeds the rate limit for a given API endpoint, the API will return an HTTP `429 Too Many Requests` error.

Use the HTTP headers in order to understand where the application is at for a given rate limit, on the method that was just utilized. Note that the HTTP headers are contextual. That is, they indicate the rate limit for the user context. If you have multiple apps (maps) accessing to their resources with the same user, HTTP headers are related to that user.

- **Carto-Rate-Limit-Limit**: total allowed requests
- **Carto-Rate-Limit-Remaining**: remaining requests
- **Retry-After**: seconds until next available request (returns `-1` if the current request is allowed)
- **Carto-Rate-Limit-Reset**: seconds until the limit will reset to its maximum capacity

### Tips

We only have 1 tip:
- If you receive a rate limit error, you must wait the seconds indicated by the `Retry-After` HTTP header (most of the time will be 1 second)

### Rate Limits Chart

Below, you can find the values of the rate limit by user account type and endpoint. Note that endpoints not listed in the chart are disabled by default.

#### Enterprise plans

|Endpoint   |Request   |Time period  |Burst  |
| :---         |          ---: |          ---: |          ---: |
| GET /api/v2/sql <br> POST /api/v2/sql |15  |1  |15  |
| POST /api/v2/sql/job        |5  |1  |5  |
| GET /api/v2/sql/job/{job_id}  |5  |1  |5  |
| DELETE /api/v2/sql/job/{job_id}  |5  |1  |5  |
| POST /api/v2/sql/copyfrom  |3  |60  |3  |
| GET /api/v2/sql/copyto  |3  |60  |3  |


#### Individual plans

|Endpoint   |Request   |Time period  |Burst  |
| :---         |          ---: |          ---: |          ---: |
| GET /api/v2/sql <br> POST /api/v2/sql |6  |1  |6  |
| POST /api/v2/sql/job        |2  |1  |2  |
| GET /api/v2/sql/job/{job_id}  |2  |1  |2  |
| DELETE /api/v2/sql/job/{job_id}  |2  |1  |2  |
| POST /api/v2/sql/copyfrom  |1  |60  |1  |
| GET /api/v2/sql/copyto  |1  |60  |1  |


#### Free plans

|Endpoint   |Request   |Time period  |Burst  |
| :---         |          ---: |          ---: |          ---: |
| GET /api/v2/sql <br> POST /api/v2/sql |6  |1  |6  |
| POST /api/v2/sql/job        |1  |1  |1  |
| GET /api/v2/sql/job/{job_id}  |1  |1  |1  |
| DELETE /api/v2/sql/job/{job_id}  |1  |1  |1  |
| POST /api/v2/sql/copyfrom  |1  |60  |1  |
| GET /api/v2/sql/copyto  |1  |60  |1  |
