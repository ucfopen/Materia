FROM ruby:2.5-alpine

RUN gem install fakes3 -v 2.0.0

# create directory for s3 to hold uploads
RUN mkdir -p /s3mnt

EXPOSE 10001

CMD ["fakes3", "-r", "/s3mnt/fakes3_root", "-p", "10001", "--license", "MIT"]
