const createResponse = function (status, data) {
  return {
    status,
    results: data.length,
    data,
  };
};
module.exports.createResponse = createResponse;
