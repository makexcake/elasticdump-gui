const fs = require('fs');

function updateTimeRange(filterFile) {
  const currentTime = new Date();
  const tenMinutesAgo = new Date(currentTime.getTime() - 10 * 60 * 1000);

  const currentTimeStr = currentTime.toISOString().slice(0, -1) + '+03:00';
  const tenMinutesAgoStr = tenMinutesAgo.toISOString().slice(0, -1) + '+03:00';

  const filterData = JSON.parse(fs.readFileSync(filterFile));

  filterData.query.bool.must[0].range['@timestamp'].gte = tenMinutesAgoStr;
  filterData.query.bool.must[0].range['@timestamp'].lt = currentTimeStr;

  fs.writeFileSync(filterFile, JSON.stringify(filterData, null, 2));
}

module.exports = {
  updateTimeRange,
};