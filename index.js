console.log('Loading function');
const aws = require('aws-sdk');
aws.config.update({region: process.env.AWS_REGION});
const s3 = new aws.S3({ apiVersion: '2006-03-01'});
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});
const dynamoDB = new aws.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Bucket Name =', event.Records[0].s3.bucket.name);
    console.log('Bucket Name =', event.Records[0].s3.object.key);

    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    console.log('Key=', key);
    const params = {
        Bucket: bucket,
        Key: key, 
    };
    
    var dynamodParam = {
      TableName: 'salesorder',
      Item: {
          'id' : {S:'fsffsdfsdfs111345'},
        'order_num' : {S: '003345'}
      }
    };
    
    ddb.putItem(dynamodParam, function(err, data) {
      if (err) {
        console.log("Dynamoput Error", err);
      } else {
        console.log("Dynamoput Success", data);
      }
    });
    
    // var dynamogetparams = {
    //   TableName: 'OrderLine',
    //   Key: {
    //     'id': {S: 'fsffsdfsdfs1112'},
    //     'order_num' : {S: '0032'}
    //   },
    //   ProjectionExpression: 'order_num, REC_TIMESTAMP'
    // };
    
    // // Call DynamoDB to read the item from the table
    // ddb.getItem(dynamogetparams, function(err, data) {
    //   if (err) {
    //     console.log("Getitem Error", err);
    //   } else {
    //     console.log("Getitem Success", data);
    //   }
    // });

//     dynamoDB.query({
//     TableName: 'OrderLine',
//     IndexName: 'ORDER_NUM-ORD_LINE_NUM-index',
//     KeyConditionExpression: '#ORDER_NUM = :ORDER_NUM AND #ORD_LINE_NUM = :ORD_LINE_NUM',
//     ExpressionAttributeNames: {
//         '#ORDER_NUM': 'ORDER_NUM',
//         '#ORD_LINE_NUM': 'ORD_LINE_NUM'
//     },
//     ExpressionAttributeValues: { 
//       ':ORDER_NUM' :  '123',
//       ':ORD_LINE_NUM' : '1111'
//     }
//   })
//   .promise()
//   .then(data => {
//       console.log(data.Items);
//       var payload = data.Items;
//       payload.map(item => {
//          console.log(item.SHIP_TO_CUST_NUM);
//       });
//       console.log("payload length");
//       console.log(payload.length);
//   })
//   .catch(console.error);

    try {

        const ContentType = await s3.getObject(params).promise();  
        let data = ContentType.Body.toString('ascii');
        console.log("Raw text:" + data);
        console.log("process.env.DESTINATION_BUCKETNAME:" + process.env.DESTINATION_BUCKETNAME);        
        // Write to S3
        const newKey = 'processed'+key;
        const conTyp = 'application/json'
        console.log("Dest key:" + key);
        const putObject = await s3.putObject({
            Bucket: process.env.DESTINATION_BUCKETNAME,
            Key: newKey,
            Body: data,
            ContentType: conTyp
        },function (err, result) {
            if(err) console.log(err);
            if(result) console.log(result);
          }).promise();

        return data; 
    } catch (err) {
        console.log(err);
        const message = 'Error getting or putting object ';
        console.log(message);
        throw new Error(message);
    }
};
