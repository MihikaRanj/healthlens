# About the healthLens app
HealthLens is an app that provides everyone with a lens into their health. It gives the user an option to understand the meaning of their health metrics and habits by providing them an insight on how their habits can reflect on their heart and diabetes disease progression. The user of this app first has to enter their lifestyle information such as height, weight, gender, physical activity details, smoking indicator, hypertension indicator and some other information. Based on the data entered, this app can then predict the risk of the user getting diabetes or heart disease. For each of the risk predictions it also gives a percentage of probability of that risk from occurring, to give more detailed custom insights to the user. For diabetes risk, it further classifies the risk between normal, pre-diabetic and diabetic progression. After the predicted risk score is displayed, the app provides the user more insights on how their lifestyle factors can impact their disease progression tailored to each user’s profile. It then generates a customized lifestyle plan for the user based on their information using Open AI API call, which can help them identify how to improve their risk score based on change in diet and habits. The app also charts how the progression of the disease will look like for the user if they did not make any change, over the course of next 10 years. Apart from this customized insight and guidance, it also allows the user to chat with a health coach chatbot anytime- wherein they can either pick from some pre-entered prompts or enter their own prompt such as - recipes for a healthy Indian breakfast. The health coach chat bot already has insights into the user's predicted diabetes and heart disease risk scores along with the inputs added by user to give a customized response.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
