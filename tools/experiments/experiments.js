/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import '../../third_party/babel/custom-babel-helpers';
import '../../src/polyfills';
import {onDocumentReady} from '../../src/document-state';
import {isExperimentOn, toggleExperiment} from '../../src/experiments';
import {getCookie, setCookie} from '../../src/cookies';

const COOKIE_MAX_AGE_DAYS = 180;  // 6 month

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   spec: string
 * }}
 */
let ExperimentDef;

/**
 * This experiment is special because it uses a different mechanism that is
 * interpreted by the server to deliver a different version of the AMP
 * JS libraries.
 */
const CANARY_EXPERIMENT_ID = 'dev-channel';


/** @const {!Array<!ExperimentDef>} */
const EXPERIMENTS = [
  // Canary (Dev Channel)
  {
    id: CANARY_EXPERIMENT_ID,
    name: 'AMP Dev Channel (more info)',
    spec: 'https://github.com/ampproject/amphtml/blob/master/' +
        'DEVELOPING.md#amp-dev-channel-experimental',
  },

  // AMP Analytics
  {
    id: 'amp-analytics',
    name: 'AMP Analytics',
    spec: 'https://github.com/ampproject/amphtml/blob/master/extensions/' +
        'amp-analytics/amp-analytics.md',
  },

  // AMP Access
  {
    id: 'amp-access',
    name: 'AMP Access',
    spec: 'https://github.com/ampproject/amphtml/blob/master/extensions/' +
        'amp-access/amp-access-spec.md',
  },

  // Amp User Notification
  {
    id: 'amp-user-notification',
    name: 'Amp User Notification',
    spec: 'https://github.com/ampproject/amphtml/blob/master/extensions/' +
        'amp-user-notification/amp-user-notification.md',
  },

  // Dynamic CSS Classes
  {
    id: 'dynamic-css-classes',
    name: 'Dynamic CSS Classes',
    spec: 'https://github.com/ampproject/amphtml/blob/master/extensions/' +
        'amp-dynamic-css-classes/amp-dynamic-css-classes.md',
  },
];


/**
 * Builds the expriments tbale.
 */
function build() {
  const table = document.getElementById('experiments-table');
  EXPERIMENTS.forEach(function(experiment) {
    table.appendChild(buildExperimentRow(experiment));
  });
}


/**
 * Builds one row of the experiments table.
 * @param {!ExperimentDef} experiment
 */
function buildExperimentRow(experiment) {
  const tr = document.createElement('tr');
  tr.id = 'exp-tr-' + experiment.id;

  const tdId = document.createElement('td');
  tdId.appendChild(buildLinkMaybe(experiment.id, experiment.spec));
  tr.appendChild(tdId);

  const tdName = document.createElement('td');
  tdName.appendChild(buildLinkMaybe(experiment.name, experiment.spec));
  tr.appendChild(tdName);

  const tdOn = document.createElement('td');
  tdOn.classList.add('button-cell');
  tr.appendChild(tdOn);

  const button = document.createElement('button');
  tdOn.appendChild(button);

  const buttonOn = document.createElement('div');
  buttonOn.classList.add('on');
  buttonOn.textContent = 'On';
  button.appendChild(buttonOn);

  const buttonOff = document.createElement('div');
  buttonOff.classList.add('off');
  buttonOff.textContent = 'Off';
  button.appendChild(buttonOff);

  button.addEventListener('click', toggleExperiment_.bind(null, experiment.id,
      experiment.name, undefined));

  return tr;
}


/**
 * If link is available, builds the anchor. Otherwise, it'd return a basic span.
 * @param {string} text
 * @param {?string} link
 * @return {!Element}
 */
function buildLinkMaybe(text, link) {
  let element;
  if (link) {
    element = document.createElement('a');
    element.setAttribute('href', link);
    element.setAttribute('target', '_blank');
  } else {
    element = document.createElement('span');
  }
  element.textContent = text;
  return element;
}


/**
 * Updates states of all experiments in the table.
 */
function update() {
  EXPERIMENTS.forEach(function(experiment) {
    updateExperimentRow(experiment);
  });
}


/**
 * Updates the state of a single experiment.
 * @param {!ExperimentDef} experiment
 */
function updateExperimentRow(experiment) {
  const tr = document.getElementById('exp-tr-' + experiment.id);
  if (!tr) {
    return;
  }
  tr.setAttribute('data-on', isExperimentOn_(experiment.id) ? 1 : 0);
}


/**
 * Returns whether the experiment is on or off.
 * @param {string} id
 * @return {boolean}
 */
function isExperimentOn_(id) {
  if (id == CANARY_EXPERIMENT_ID) {
    return getCookie(window, 'AMP_CANARY') == '1';
  }
  return isExperimentOn(window, id);
}


/**
 * Toggles the experiment.
 * @param {string} id
 * @param {boolean=} opt_on
 */
function toggleExperiment_(id, name, opt_on) {
  const currentlyOn = isExperimentOn_(id);
  const on = opt_on === undefined ? !currentlyOn : opt_on;
  // Protect against click jacking.
  const confirmAndmakeLinterHappy = 'confirm';
  const confirmMessage = on ?
      'Do you really want to activate the AMP experiment' :
      'Do you really want to deactivate the AMP experiment';
  if (!window[confirmAndmakeLinterHappy](`${confirmMessage}: "${name}"`)) {
    return;
  }
  if (id == CANARY_EXPERIMENT_ID) {
    const validUntil = new Date().getTime() +
        COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    setCookie(window, 'AMP_CANARY', (on ? '1' : '0'), (on ? validUntil : 0));
  } else {
    toggleExperiment(window, id, on);
  }
  update();
}


// Start up.
onDocumentReady(document, () => {
  build();
  update();
});
