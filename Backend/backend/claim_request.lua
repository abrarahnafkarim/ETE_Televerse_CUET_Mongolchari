-- KEYS[1]=request_key, ARGV[1]=driver_id
local status = redis.call("HGET", KEYS[1], "status")
if status ~= "OPEN" then
    return 0
end
redis.call("HSET", KEYS[1], "status", "ASSIGNED")
redis.call("HSET", KEYS[1], "assigned_driver", ARGV[1])
return 1
