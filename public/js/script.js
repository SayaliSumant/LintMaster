//LOGIN FORM POP-UP

const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("logBtn");
const closeForm = document.getElementById("closeX");
const signup = document.getElementById("register");
// Show form when Register button is clicked
loginBtn.onclick = function() {
   form.style.display = "flex";
};
// Close form when 'X' is clicked
closeForm.onclick = function() {
   form.style.display = "none";
};
// Close form if user clicks outside the modal content
window.onclick = function(event) {
    if (event.target === form) {
       form.style.display = "none";
    }
};


//REGISTRATION FORM POP-UP

const modal = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");
const closeModal = document.getElementById("closeForm");
const signin = document.getElementById("signin")
console.log("3");
// Show form when Register button is clicked
registerBtn.onclick = function() {
  modal.style.display = "flex";
  console.log("4");
};
//if user doesn't have an account & can't log in he'll redirect to the registration form from login form
signup.onclick = function() {
  form.style.display = "none";
  modal.style.display = "flex";
};
//if user already has an account & currently is on register form then he'll redirect to the login form from register form
signin.onclick = function() {
  modal.style.display = "none";
  form.style.display = "flex";
};
// Close form when 'X' is clicked
closeModal.onclick = function() {
  modal.style.display = "none";
};
// Close form if user clicks outside the modal content
window.onclick = function(event) {
  if (event.target === modal) {
      modal.style.display = "none";
  }
};
//Register form validation
document.getElementById('registerForm').addEventListener('submit', function(event) {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const password2 = document.getElementById('password2').value;

  // Validate if all fields are filled
  if (!username || !email || !password || !password2) {
      alert("Please fill in all the fields");
      event.preventDefault();  // Prevent form submission
      return;
  }

  // Validate if passwords match
  if (password !== password2) {
      alert("Passwords do not match");
      event.preventDefault();  // Prevent form submission
      return;
  }

  // Check if password meets criteria
  if (password.length < 6) {
      alert("Password must be at least 6 characters");
      event.preventDefault();  // Prevent form submission
      return;
  }
});



//FUNCTION TO CHECK IF USER IS LOGGED IN OR NOT
async function checkSessionStatus() {
  const res = await fetch('/session-status');
  const data = await res.json();

  if (data.loggedIn) {
    document.getElementById('logout').style.display = 'block';
    document.getElementById('logBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
  } else {
    document.getElementById('logout').style.display = 'none';
    document.getElementById('logBtn').style.display = 'block';
    document.getElementById('registerBtn').style.display = 'block';
  }
}
// Call this function when the page loads
window.onload = checkSessionStatus;

// LOGIN functionality
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector("[id='#log]]");  // Correctly using #log for ID selector
  if (form) {  // Check if the form element exists
    form.addEventListener('submit', async (event) => {
      event.preventDefault();  // Prevent default form submission behavior

      const formData = new FormData(event.target);  // Gather form data
      try {
        const res = await fetch('/login', {
          method: 'POST',
          body: formData,
          redirect: 'follow'  // Allow fetch to follow redirect
        });

        // Handle redirection
        if (res.redirected) {
          window.location.href = res.url;
          // Navigate to the redirected page
        } else {
          const data = await res.json();
          if (!data.success) {
            alert("Login failed, please try again.");
          }
        }
      } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred. Please try again later.");
      }
    });
  } else {
    console.error("Form with id #log not found");
  }
});



// LOGOUT handling
document.getElementById('logout').addEventListener('click', async () => {
   const res = await fetch('/logout', { method: 'POST' });

   // Redirect will happen automatically if the backend sends a redirect response
   if (res.redirected) {
     window.location.href = res.url; // This will navigate to the redirected page
   } else {
     alert('Error during logout');
   }
});



//CODE EDITOR

let editor = ace.edit(document.getElementById('codeInput'), {
  theme: "ace/theme/cloud9_night",
  mode: 'ace/mode/javascript'
});
// Get the initial value
const initialContent = editor.getValue();

// CHARACTER COUNT FUNCTION FOR EDITOR
document.addEventListener('DOMContentLoaded', () => {
  const charCount = document.getElementById('count');
  const maxLength = 10000;
  // Update character count initially
  charCount.textContent = initialContent.length + '/10000';
  // Add 'change' event listener
  editor.on('change', () => {
    charCount.textContent = editor.getValue().length + '/10000';
  });
  const codeTypeDropdown = document.getElementById('codeType');
  codeTypeDropdown.addEventListener('change', () => {
    const selectedMode = codeTypeDropdown.value;
    switch (selectedMode) {
      case 'html':
        editor.getSession().setMode('ace/mode/html');
        break;
      case 'css':
        editor.getSession().setMode('ace/mode/css');
        break;
      case 'js':
        editor.getSession().setMode('ace/mode/javascript');
        break;
      case 'embedded':
        editor.getSession().setMode('ace/mode/html');
        break;
      default:
        // Handle invalid or unsupported mode
        break;
    }
  });
});


//CODE SUBMISSION FOR SYNTAX-CHECKING
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('syntax-checker');
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const codeType = document.getElementById('codeType').value;
      const code = editor.getValue();
      
      const response = await fetch('/check-syntax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codeType, code })
      });
      
      const result = await response.json();
      
      displayErrors(result);
    });
    
    function displayErrors(errors) {
      const errorsDiv = document.getElementById('errors');
      errorsDiv.innerHTML = formatErrors(errors);
      errorsDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    function formatErrors(errors) {
      if (!errors || errors.length === 0) return '<p>No errors found.</p>';
      
      return errors.map(error => {
        return `<p>Line ${error.line || error.lineNumber}: ${error.message}</p>`;
      }).join('');
    }
});


//SNIPPET MANAGER

//when the user will click on save button then this eventhandler will be executed
document.getElementById('saveSnippet').addEventListener('click', function() {
  // Check if the user is logged in
  fetch('/session-status')
      .then(response => response.json())
      .then(data => {
          if (data.loggedIn) {
              // User is logged in, save the snippet
              saveSnippet();
          } else {
              // User is not logged in, trigger the login modal
              openLoginModal();
          }
      })
      .catch(error => console.error('Error:', error));
});
//Function  to save snippet 
function saveSnippet() {
  const codeType = document.getElementById('codeType').value;
  const snippet = editor.getValue();
  fetch('/saveSnippet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ codeType, snippet })  // Ensure it's properly JSON formatted
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Snippet saved successfully!');
    } else {
      alert('Failed to save snippet.');
    }
  })
  .catch(error => console.error('Error:', error));
}
//if the user is not logged in while savin snippet then this function will be executed
function openLoginModal() {
  // Assuming your login modal has an ID of 'loginModal'
  const loginModal = document.getElementById('loginForm');
  loginModal.style.display = 'flex';  // Display the login modal

  // Optionally focus on the username field in the modal
  document.getElementById('user').focus();
}

// Fetch snippets when the Snippet Manager from navbar is clicked
document.getElementById('snippetManagerLink').addEventListener('click', function() {
  fetch('/fetchSnippets')
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              displaySnippets(data.snippets);  // Call a function to display the snippets
          } else {
              alert('Failed to load snippets.');
          }
      })
      .catch(error => {
          console.error('Error fetching snippets:', error);
      });
});
// Function to display snippets on the page
function displaySnippets(snippets) {
  const snippetContainer = document.getElementById('snippetContainer');  // The div where snippets will be displayed
  snippetContainer.innerHTML = '';  // Clear previous content

  if (snippets.length > 0) {
      snippets.forEach(snippet => {

          const snippetElement = document.createElement('div');
          snippetElement.classList.add('snippet');  // Add class for styling

          // Escape HTML in the code
          const escapedCode = snippet.code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');

          // Display snippet details
          snippetElement.innerHTML = `
              <h3>Code Type: ${snippet.code_type}</h3>
              <pre>${escapedCode}</pre>
          `;
          snippetContainer.appendChild(snippetElement);  // Add to the container
      });
  } else {
      snippetContainer.innerHTML = '<p>No snippets found.</p>';
  }
}