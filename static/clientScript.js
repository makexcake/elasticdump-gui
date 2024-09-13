
const init = async () => {
  try {
    const defaultFilter = await fetch('/default-filter')
    // Fetch the default filter from the server
    .then((response) => response.json())
    .then((data) => data).catch((error) => {
      throw new Error('An error occurred while fetching the default filter:', error);
    });
    
    // Find the filter element in the form
    const userFilter = document.getElementById('filter');
    if (!userFilter) {
      throw new Error('Filter element not found in this form.');
    }

    // console.log('Default Filter:', defaultFilter.query.bool.must[0].range['@timestamp']);
    defaultFilter.query.bool.must[0].range['@timestamp'].gte = new Date(new Date().getTime() - 10 * 60 * 1000);
    defaultFilter.query.bool.must[0].range['@timestamp'].lt = new Date();

    // Set the default filter in the form
    userFilter.value = JSON.stringify(defaultFilter, null, 2);
  } catch (error) {
    console.error('An error occurred while initializing the form:', error);
  }
};

window.document.addEventListener('DOMContentLoaded', init);
