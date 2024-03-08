import admin from 'firebase-admin';
import { FIREBASE_STORAGE_ID } from './environment';

const firebaseAuthKey = {
  "type": "service_account",
  "project_id": "dev-website-clone",
  "private_key_id": "afc58301c1e5775715b6bfa6516d4694fc029160",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC4g5UixrvBFXRh\nQksKNQPEFARbeHTH/wgdDC2i504hVo3ozbrbpF/lmFoFPXhK6InFN64nWDaFGO4g\n0bBXIzcXW67W5eTTAXlkYlJgwNJtRYUM0813R/pXaMUBdhN7lr6IgKkgopVuJNQ5\n/NihFJjFqXYnP8gbdlDXSQHZRc/ECdjKI2CkpMIrvvi6QehkdWwC/hPzN/dRGW31\n5aA9K7jzEzNi8xl8JKvgHVSlbdkt/d+w2Gy95LK7kjDZYF2vGrNZMjeXMCMBWyWS\nRDUDbF2iJleq0f3fn4RSSnQ0rykjFQ1gvDD58weRpAEkZ1fJvwogxv1g0F4KavGm\nDc76krSvAgMBAAECggEACZ+XtgCC0bdYonJpQROWG+smA+tMhb3TjUhKi0RurKat\nk9+X66q9ZTrvhiDi818Az54aYYedShzv+hrj4beUJI4RfA3VQ/ujXfeEKJ2wm+23\nvjYVVPbBFbFWMKNueAkiJU9TO8DX8+d3K4P4YASXxI2i39XYxvwep+9i99pjtyR6\njEovW8lyLq4uI6ZKZx7OWJHM0mjdGd5KaNLTujBZ02Xcd2c3ZY8PkUICt026+iu2\nj9wv+NP6EHktLhDZPVCk0QPfSJfhSF+2qaB/eZoPUsKmgTbWNts3jiC0dwxoPiPI\nDkEmlpJWMqkZD3dSdZzfSg4oTQumGurYVlZFOXoIOQKBgQDccDQRxwoK8Ez1Kv8v\nd44QGFgQLU4mL1QQNmtYe/es+AlTmYUaHyabrbptGQyV5asi3dkJtA4DJLq6ECPW\nOh/1r9UqBH8FLoOocPABlf6X+nePjkgTCFX3PnLFsg51YwKghmfMkNUlBk+o8nuV\nvIPSZ8Vxdy0Ju2uCy2kjovH2FQKBgQDWR8FZSVfclCtCgl8WSfU0Zu4ki3ogaoGm\nA2PNxBOmPeseerBNlDbTCJW3+Ybp/4xcPczcojzK7xEXudj2VufB8IMiuaRJEau2\nyEQ7dW+RHfX4chXF1RumsNhLcUL6aQzga/XYPopRLmduLiXEB197iqEODHFr1Uv/\nmJ12WAIUswKBgQCLUotGVSNeyIQLTFKe4JQ0Tf6Sst+6uJ0L5ikwcqGWe+oBIX2D\nhf6z1DiIrZVLxC3GyqpbPKbCi9tMr9jGlFQQx0IV3WOelch2lHLMvc18prwcSlP5\nW4Jh0uFdW+1RefN2G5zNKRjd3sBISoGboNs8B4Q985HOndsUfpWEBX+iBQKBgQDN\nXF2gTZtICjTffATXXrACtbb8DTRRRuHUEiGffZB7XZItVtYKs8ZLQEoE1L8JGeIS\nMSRaO55Zuv69p16Y0Dcy9mcna5VYdfgEqDBEb8sp3/XxUp0tSY1Dlu7kdrsDNJSj\nrLQjt+Rl4zw7Kz0EfzByPS0XQrOc7gH1BvW6CqSL4wKBgBzR+YA4dPju4EHpPsQj\nd+wuYFNAVd9rR6gJAEsRY1Fr1FAPnsV11uI1SAmAsCiM7Q1VckfJK8483DVWV/5Y\nuZHP5rBNgaQXRfFt0Q+k1kJNz4Pi7fENTAldApGNb3vLINfWVMh+WaFtVhfL5gYj\nkiIqm97vQfS7KFd+zBXEPiqd\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-jz6bz@dev-website-clone.iam.gserviceaccount.com",
  "client_id": "111681003681718057676",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-jz6bz%40dev-website-clone.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

export const configFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAuthKey as admin.ServiceAccount),
    storageBucket: FIREBASE_STORAGE_ID
  });
}