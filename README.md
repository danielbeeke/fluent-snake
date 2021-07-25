# FluentSnake

This library makes it possible to write API libraries that allow for:

```
  const response = await api
  .fetch('https://en.wikipedia.org/wiki/Linux')
  .querySelector('.infobox tr:nth-child(4) td a')
  .href()
  .fetch()
  .querySelector('#firstHeading')
  .text()

  // Unix-like
```


It allows for chaining methods that return Promises.
You can use it in the browser, the tests are written with Deno.

You can test with `deno test --unstable --allow-all`