from flask import Flask, jsonify, make_response
from flask_cors import CORS, cross_origin
import psycopg2
import os
import requests

app = Flask(__name__)
CORS(app)

dict = {"2022-02" : "logmarch2022", 
        "2022-03" : "logmarch2022",
        "2022-04" : "logapril2022", 
        "2022-05" : "logmay2022", 
        "2022-06" : "logjune2022",
        "2022-07" : "logjuly2022", 
        "2022-08" : "logaugust2022", 
        "2022-09" : "logseptember2022", 
        "2022-10" : "logoctober2022", 
        "2022-11" : "lognovember2022", 
        "2022-12" : "logdecember2022", 
        "2023-01" : "logjanuary2023", 
        "2023-02" : "logfebruary2023", 
        "2023-03" : "logmarch2023", 
        "2023-04" : "logapril2023", 
        "2023-05" : "logmay2023", 
        }
# database configuration
conn = psycopg2.connect(
    database="dvproject",
    user="smitpatel",
    password="",
    host="localhost",
    port="5432"
)

PORT = 8002


@app.route('/')
@cross_origin()
def hello():
    return make_response(jsonify("Hello world!!"), 200)


# Heatmap
@app.route('/heatmap/<string:input>', methods=['GET'])
@cross_origin()
def get_heatmap_data(input):
    
    print("HEATMAP API CALLED")
    params = input.split("&")
    date = params[0]
    hour = int(params[1])
    var = date.split('-')[0] + "-" + date.split('-')[1]

    if var in dict:
        print("REQUEST: " + date + " " + str(hour))

        query = "select currentlocation, participantid, availablebalance, currentmode from "+ dict[var] +" where "
        from_time = "\'" + date + " " + "{:02d}".format(hour) + ":00:00-07 \'" + "::timestamp"
        to_time = "\'" + date + " " + "{:02d}".format(hour) + ":01:00-07 \'" + "::timestamp"

        query += "timestamp >= " + from_time + " and timestamp < " + to_time
        cur = conn.cursor()
        cur.execute(query)
        rows = cur.fetchall()

        data = [{'currentlocation': row[0], 'participantid': row[1], 'availablebalance': row[2], 'currentmode': row[3]} for row in rows]

        print("RESPONSE: " + str(data))

        print("HEATMAP API CALL END")
        return make_response(jsonify(data), 200)

    else:

        return make_response(jsonify("ENTER CORRECT DATE"), 400);


# Circular Packing
# select buildingId, businessType, businessId, maxOccupancy from buildingsupdated
# where buildingId in ('556', '29', '1012', '164');
@app.route('/business/<string:selected_ids>', methods=['GET'])
@cross_origin()
def get_business_data(selected_ids):
    print("BUSINESS API CALLED")
    print("REQUEST: " + selected_ids)
    query = "select buildingId, businessType, businessId, maxOccupancy from buildingsupdated where buildingId in ("
    selected = selected_ids.split("&")
    for i in range(len(selected)):
        if i != len(selected)-1:
            query += "\'" + selected[i] + "\', "
        else:
            query += "\'" + selected[i] + "\'" + ")"

    print("PRINTING QUERY: " + query)
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    data = [{'buildingId': row[0], 'businessType': row[1], 'businessId': row[2], 'maxOccupancy': row[3]} for row in rows]

    print("RESPONSE: " + str(data))
    print("BUSINESS API CALL END")
    return make_response(jsonify(data), 200)


# Bar Chart
# select participantId from checkinjournal
# where venueId = {passedValue}
# and timestamp > '2022-02-28 17:00:00-07'::timestamp
# and timestamp < '2022-03-02 17:00:00-07'::timestamp;
@app.route('/barchart/<string:input>', methods=['GET'])
@cross_origin()
def get_num_visited(input):
    print("VISITS API CALLED")

    params = input.split("&")
    date = params[0]
    venueId = str(params[1])

    print("REQUEST: " + date + " " + venueId)
    
    hourly_data = []
    for i in range(1, 25):
        query = "select participantId from checkinjournal where venueId=" + "\'" + venueId + "\'" + " and timestamp >= "
        from_time = "\'" + date + " " + "{:02d}".format(i-1) + ":00:00-07 \'" + "::timestamp"
        to_time =  "\'" + date + " " + "{:02d}".format(i) + ":00:00-07 \'" + "::timestamp"
        query += from_time + " and timestamp < " + to_time
        cur = conn.cursor()
        cur.execute(query)
        rows = cur.fetchall()
        temp = []
        for row in rows:
            temp.append(row[0])
        
        # print(temp)
        # print(query)

        spending = ""
        if len(temp) != 0:
            sub_query = from_time + "&" + to_time + "&"
            for i in range(len(temp)):
                if i != len(temp)-1:
                    sub_query += str(temp[i]) + "&"
                else:
                    sub_query += str(temp[i])
            # print("Inside" + " " + sub_query)

            base_url = "http://127.0.0.1:" + str(PORT) + "/earnings/" + sub_query
            reponse = requests.get(base_url)
            # print(reponse.text[3:-3])
            if reponse.text == "" or reponse.text == "null\n" or reponse.text == None or len(reponse.text) == 0 or reponse.text == "None":
                # print("IN HERE !!!!!!!")
                spending += "0"
            else:
                # print("IN HERE ???????? " + reponse.text[1:-2])
                spending += reponse.text[1:-2]
        else:
            spending += "0"

        # print("FINAL RESPONSE: " + spending)


        hourly_data.append({'participants': temp, 'spending': float(spending)})

    print("RESPONSE: " + str(hourly_data))
    print("VISITS API CALL END")
    return make_response(jsonify(hourly_data), 200)


# Pie/ Radar Chart
# select SUM(CAST( amount AS numeric)) from financialjournal
# where timestamp > '2022-02-28 17:00:00-07'::timestamp
# and timestamp < '2022-03-02 17:00:00-07'::timestamp
# and participantid in ('60', '132', '622', '197', '25', '82' )
# and category = 'Food';
@app.route('/earnings/<string:input>', methods=['GET'])
@cross_origin()
def get_earnings(input):
    print("EARNINGS API CALLED")

    params = input.split("&")
    from_date = params[0]
    to_date = params[1]
    participantids = params[2:]

    print("REQUEST: " + from_date + " " + to_date + " " + str(participantids))
    query_participants = "("
    for i in range(len(participantids)):
        if i != len(participantids)-1:
            query_participants += "\'" + participantids[i] + "\', "
        else:
            query_participants += "\'" + participantids[i] + "\'" + ")"
    
    query = "select SUM(CAST( amount AS numeric)) from financialjournal where timestamp >= "
    query += from_date + " and timestamp < " + to_date + " and participantid in " + query_participants
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    # print("RESPONSE: " + str(rows[0][0]))
    print("RESPONSE IN EARNINGS: " + str(rows))
    print("EARNINGS API CALL END")
    # return make_response(jsonify(hourly_data), 200)

    return make_response(jsonify(rows[0][0]), 200)


# Interactive Scatter Plot
# select timestamp, participantid, currentmode from log_table
# where timestamp > '2022-02-28 17:00:00-07'::timestamp
# and timestamp < '2022-03-02 17:00:00-07'::timestamp
# and participantid in ('1', '2', '3', '4', '5');
@app.route('/activity/<string:input>', methods=['GET'])
@cross_origin()
def get_acitvities(input):
    params = input.split("&")
    date = params[0]
    var = date.split('-')[0] + "-" + date.split('-')[1]
    participantids = params[1:]

    if var in dict:
        # print("REQUEST: " + date + " " + str(hour))
        query_participants = "("
        for i in range(len(participantids)):
            if i != len(participantids)-1:
                query_participants += "\'" + participantids[i] + "\', "
            else:
                query_participants += "\'" + participantids[i] + "\'" + ")"

        hourly_data = []
        for i in range(0, 24):
            query = "select timestamp, participantid, currentmode from "+ dict[var] +"  where participantid in " + query_participants + " and timestamp >= "
            from_time = "\'" + date + " " + "{:02d}".format(i) + ":00:00-07 \'" + "::timestamp"
            to_time = "\'" + date + " " + "{:02d}".format(i) + ":01:00-07 \'" + "::timestamp"
            query += from_time + " and timestamp < " + to_time
            cur = conn.cursor()
            cur.execute(query)
            rows = cur.fetchall()
            # temp = [{'timestamp': row[0], 'participantid': row[1], 'currentmode': row[2]} for row in rows]
            temp = []
            for row in rows:
                if len(row) >= 3:
                    temp.append({'timestamp': row[0], 'participantid': row[1], 'currentmode': row[2]})
                else:
                    print("SKIPPING DATA: " + str(row))
            hourly_data.append(temp)

    return make_response(jsonify(hourly_data), 200)


# Chord Chart
# select participantIdFrom, participantIdTo from socialnetwork
# where timestamp = '2022-02-28 17:00:00-07'::timestamp
# and participantIdFrom in ('1', '2', '3', '4', '5');
@app.route('/social_network/<string:input>', methods=['GET'])
@cross_origin()
def get_social_connections(input):

    print("SOCIAL NETWORK API CALLED")
    params = input.split("&")
    date = params[0]
    participantids = params[1:]

    print("REQUEST: " + date + " " + str(participantids))

    query_participants = "("
    for i in range(len(participantids)):
        if i != len(participantids) - 1:
            query_participants += "\'" + participantids[i] + "\', "
        else:
            query_participants += "\'" + participantids[i] + "\'" + ")"

    query_time = "\'" + date + " " + "17:00:00-07 \'" + "::timestamp"
    query = "select participantidfrom, participantidto from socialnetwork where timestamp=" + query_time + " and participantidfrom in " + query_participants
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    data = [{'participantidfrom': row[0], 'participantidto': row[1]} for row in rows]

    print("RESPONSE: " + str(data))
    print("SOCIAL NETWORK API CALL END")

    return make_response(jsonify(data), 200)


# if __name__ == '__main__':
#     app.run(
#     host=os.getenv('LISTEN', '0.0.0.0'),
#     port=int(os.getenv('PORT', '8000')),
#     debug=True
#     )

app.run(
    host=os.getenv('LISTEN', '0.0.0.0'),
    port=int(os.getenv('PORT', PORT)),
    debug=True
    )