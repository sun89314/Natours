/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const resetPassword = async (data,url) => {
  try {
    console.log(url)
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `${res.data.message}...Redirecting to login page` );
      window.setTimeout(() => {
        location.assign('/login');
      }
      , 1000);

    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
