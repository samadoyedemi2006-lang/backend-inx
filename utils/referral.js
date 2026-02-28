function genReferralCode() {
  return 'VG' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
module.exports = { genReferralCode };