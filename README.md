# elasticdump-gui

Not long ago, I needed to export an index from one Elasticsearch instance to another in different air-gapped environments. There was no simple tool to accomplish this without provisioning Logstash or using the elasticdump command.

To address this issue, I wrote a simple program in JavaScript, based on the elasticdump node library: 
https://github.com/elasticsearch-dump/elasticsearch-dump

Essentially, this service is elasticdump wrapped in a GUI and deployed via Docker Compose and soon on K8s.

![Screenshot 2024-09-13 132827](https://github.com/user-attachments/assets/4313dac1-2d08-4929-8c25-6549bf281c95)

## Installation

First, we need to package the service into a container. Here's an example `docker-compose.yaml` file:

```yaml
services:

  elasticdump-gui:
    # build: .
    image: elasticdump-gui:latest
    ports:
      - "8080:3000"
    # Here we set default parameters in case there is one default index that needs to be pulled.
    environment:
      - SCHEME=https
      - USERNAME=elastic
      - PASSWORD=<elastic-password>
      - ENDPOINT=elastic.example.local:9092
      - NODE_TLS_REJECT_UNAUTHORIZED=0 # In case your Elasticsearch is insecure
      - INDEX_NAME=example*
    volumes: 
      - <local-path>:/app/imported-indices # Folder for imported indexes
      - <local-path>:/app/filters # Folder for default filters
```

## Usage

The next step is straightforward. The GUI contains a few simple fields to be filled out.
To pull the entire index, just insert an empty filter `{}` into the filter field.

Example of a filter:

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "@timestamp": {
              "gte": "2024-05-05T22:00:59.999+03:00",
              "lt": "2024-05-08T22:09:59.999+03:00"
            }
          }
        },
        {
          "bool": {
            "should": [
              {
                "match_phrase": {
                  "kubernetes.labels.app_kubernetes_io_name": "service-1"
                }
              },
              {
                "match_phrase": {
                  "kubernetes.container_name": "service-2"
                }
              }
            ],
            "minimum_should_match": 1
          }
        }
      ]
    }
  }
}
```

When the index is pulled, you will find it in the folder specified in the `volumes` section of the `docker-compose.yaml` file. It will be named `my-index-data.json`.

## Future Updates

- Gui refactoring
- Dynamic filter construction
- Security implemintation
- Helm chart for deployment on k8s

Thank you for your interest, and you are welcome to contribute!