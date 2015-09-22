# Unit tests

```
php oil test
```

# Selenium Tests

## Locally

**First time only:** Install the Selenium server:

```
npm install -g selenium-standalone
selenium-standalone install
```

Start the Selenium server:

```
selenium-standalone start
```

Run the jasmine test suite:

```
jasmine-node --coffee --captureExceptions spec/
```

## Browserstack

Add the Browserstack keys as environment variables:

```
export BROWSERSTACK_USER [your browserstack username]
export BROWSERSTACK_KEY [your browserstack automate key]
```

Download the [Browserstack Local commandline tool](https://www.browserstack.com/local-testing).

Run it with your key in a different terminal instance:

```
./BrowserStackLocal [key] -forcelocal -force
```

Run the suite:

```
jasmine-node --coffee --captureExceptions spec/
```
