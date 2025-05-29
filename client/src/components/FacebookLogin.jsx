import React, { useEffect } from 'react';
import { Button } from 'antd';
import { FaFacebook } from "react-icons/fa";

const FacebookLoginButton = ({ onSuccess, onFailure, loading = false }) => {
  useEffect(() => {
    // Load Facebook SDK
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v2.3'
        });
      };

      // Load the SDK asynchronously
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB) {
      onFailure({ error: 'Facebook SDK not loaded' });
      return;
    }

    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const loginOptions = { 
      scope: 'email,user_birthday,user_gender',
      // Enable mobile redirect for better mobile experience
      ...(isMobile && { 
        display: 'popup',
        auth_type: 'rerequest'
      })
    };

    window.FB.login((response) => {
      if (response.authResponse) {
        // Get user info
        window.FB.api('/me', { 
          fields: 'name,email,picture,first_name,last_name,gender,birthday' 
        }, (userInfo) => {
          if (userInfo && !userInfo.error) {
            onSuccess(response.authResponse.accessToken);
          } else {
            onFailure({ error: 'Failed to get user info', details: userInfo });
          }
        });
      } else {
        // Handle different error cases
        if (response.status === 'not_authorized') {
          onFailure({ error: 'User cancelled login or did not fully authorize.' });
        } else if (response.status === 'unknown') {
          onFailure({ error: 'An error occurred. Please try again.' });
        } else {
          onFailure(response);
        }
      }
    }, loginOptions);
  };

  return (
    <Button
      type="default"
      onClick={handleFacebookLogin}
      loading={loading}
      disabled={loading}
      style={{
        width: '100%',
        height: window.innerWidth <= 480 ? '34px' : '38px', // Responsive height
        backgroundColor: '#1877f2',
        borderColor: '#1877f2',
        color: 'white',
        fontWeight: '500',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'start',
        boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
        fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
        fontSize: window.innerWidth <= 480 ? '13px' : '14px', // Responsive font
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        // Better touch target for mobile
        minHeight: '44px', // iOS recommended touch target
        touchAction: 'manipulation' // Prevent zoom on double tap
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.target.style.backgroundColor = '#166fe5';
          e.target.style.borderColor = '#166fe5';
          e.target.style.boxShadow = '0 2px 4px 0 rgba(60,64,67,.30), 0 2px 6px 2px rgba(60,64,67,.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.target.style.backgroundColor = '#1877f2';
          e.target.style.borderColor = '#1877f2';
          e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)';
        }
      }}
          >
        <div style={{height: '20px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'start'}}>
          <FaFacebook size={22}/>
        </div>
        <div style={{width: '100%',textAlign: 'center',fontSize: '14px'}}>
          {loading ? 'Signing in...' : 'Sign in with Facebook'}
        </div>
      </Button>
  );
};

export default FacebookLoginButton; 