function sleep (millisecs) {
  return new Promise(resolve => setTimeout(resolve, millisecs))
}

exports.sleep = sleep
