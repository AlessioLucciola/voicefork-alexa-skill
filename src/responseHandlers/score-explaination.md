# Restaurant disambiguation via query and context similarity

1. The user gives all the details for the restaurant they want to reserve. (restaurantName, date, time, numPeople). Let's say the user wants to book the restaurant "Pizzeria Da Pulcinella"
2. The systems make a restaurant search based on the query (Pizzeria Da Pulcinella). If the localization is active, the system uses the user's coordinates, otherwise it uses the city that the user has to input. This returns a list of restaurant along with the distance in $[0,\sim 1]$ (sometimes something a little bit greater than 1 can happen IDK) inside the `nameDistance` field.
3. Filters out the restaurants whose name distance from the query is less than the `DISTANCE_THRESHOLD`.
4. For each restaurant, it creates a `ReservationContext` object, that describes the current context the user is in. The context is matched for each restaurant in the previous list of restaurants. If the users has a reservation history for the restaurant $r$, then the `contextDistance` for `r` will be defined, and will be a number in $[0, \infin]$, where an acceptable value is usuallyu around $[0,3]$. If the user never reserved for the restaurant $r$, then `contextDistance = null`;
5. For each restaurant, an aggregated score (that somehow models the probability that the restaurant is the correct restaurant, so the higher the better) is computed from the `nameDistance` value and the `contextDistance` value. First the `contextDistance` has to be normalized in order to be a value in $[0,1]$. The normalization follows a `NORMALIZATION_MAP`, that is an object that maps for each value of `contextDistance` it's normalized values. The values that are not explicitly mapped that are in between two mappings are linearly interpolated, meaning a intermediate value is assigned. This ensure to have a particular distribution of values for the `contextDistance` that is spread for values $in [0,3]$, and doesn't change much for values in $[3, \infin]$. This because most of the values will be $in [0,3]$. One done that, we have to distinguish three cases:
   To ease the mathematical expressions, let $d_n$ be the `nameDistance` and $d_c$ the `contextDistance`:
    1. If the restaurant has both `nameDistance` and `contextDistance` defined, we compute the score as:
       Let $w$ be the `CONTEXT_WEIGHT`
        $$
        \text{score} = 1 - ((1-w) \cdot d_n + w \cdot \text{normalized}(d_c))
        $$
    2. If the restaurant has only `nameDistance` defined and `contextDistance == null`, we compute the score as:
        $$
        \text{score} = 1 - \min(\max(d_n, 0.05) ^ {0.5}, 1)
        $$
        The $\min$ is used to cap the value to 1, and the $\max$ is used to lower bound the minimum to $0.05$. The $0.5$ exponent is regulated by the `NULL_DISTANCE_SCALING_FACTOR`, the higher, the more importance is given to the score of the restaurants that have `contextDisatance == null`
    3. If all the restaurants in the list have `contextDistance == null`, we compute the score by just doing:
        $$
        \text{score} = 1 - d_n
        $$
