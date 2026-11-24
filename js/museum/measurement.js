// SPDX-License-Identifier: Apache-2.0
// Exact coefficient arithmetic for the upcoming Volume Exchange.
// R = radius, D = 2R. Volumes are in fixed Cartesian cubic units.
import {ExactRational} from '../../vendor/vanillajs/modules/exact-rational/index.js';
const radius=r=>{if(!Number.isSafeInteger(r)||r<1||r>200)throw new RangeError('radius must be 1..200 hundredths');return new ExactRational(r,100);};
export function volumeExchange(radiusHundredths){
  const r=radius(radiusHundredths),cube=r.multiply(r).multiply(r);
  // Vtet = sqrt(2) * (2/3) * R^3. Keep its coefficient exact.
  const tetCoefficient=cube.multiply(new ExactRational(2,3));
  const squaredRatio=cube.multiply(cube).divide(tetCoefficient.multiply(tetCoefficient).multiply(new ExactRational(2)));
  return Object.freeze({cube,tetCoefficient,squaredRatio});
}
